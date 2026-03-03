import {
  generateReceiptId,
  razorpay,
  validateSignature,
} from "../utils/razorpay";
import { IndPayment } from "@/validations/payment";
import { PaymentStatus, Vendor, Prisma } from "@prisma/client";
import { db } from "@/db";
import authHeaders from "@/utils/auth-headers";
import { PaymentsQueryOptions } from "@/types/payments";
import { sendPaymentNotification } from "./notification-delivery.service";
import { parseDateRange } from "@/utils/helper-fns";

export const createBkashPayment = async (
  amount: number,
  token: string,
  orderId: string,
) => {
  try {
    const response = await fetch(
      `${process.env.BKASH_BASE_URL}/tokenized/checkout/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "X-APP-Key": process.env.BKASH_APP_KEY || "",
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: " ",
          callbackURL: `${process.env.BKASH_CALLBACK_URL}`,
          amount: amount ? amount.toString() : "0",
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: orderId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to create payment: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.statusCode !== "0000") {
      if (data.statusMessage?.toLowerCase().includes("insufficient balance") ||
        data.statusCode === "2024") {
        throw new Error(`Insufficient balance: ${data.statusMessage}`);
      }

      throw new Error(`bKash payment failed: ${data.statusMessage || data.statusCode}`);
    }

    await db.payment.update({
      where: { orderId: orderId },
      data: {
        paymentId: data.paymentID!,
      },
    });

    return data;
  } catch (error) {
    console.error("Error creating bKash payment:", error);
    throw error;
  }
};

export const initiateIndianPaymentService = async (
  amount: number,
  orderId: string,
) => {
  const receiptId = generateReceiptId(orderId);
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: receiptId,
      payment_capture: 1,
    });

    await db.payment.update({
      where: { orderId: orderId },
      data: {
        razorPayId: order.id,
      },
    });

    return order;
  } catch (error) {
    throw error;
  }
};

export const validateBdPayment = async (paymentID: String) => {
  try {
    const headers = await authHeaders();
    const executeResponse = await fetch(
      `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          authorization: headers.authorization || "",
          "x-app-key": process.env.BKASH_APP_KEY || "",
        },
        body: JSON.stringify({
          paymentID,
        }),
      },
    );

    const result = await executeResponse.json();

    if (result.statusCode && result.statusCode === "0000") {
      await db.payment.update({
        where: { orderId: result.merchantInvoiceNumber },
        data: {
          status: PaymentStatus.PAID,
          vendor: Vendor.BKASH,
          transId: result.trxID,
          currency: result.currency,
          amount: parseInt(result.amount),
          paymentId: paymentID.toString(),
        },
      });

      const order = await db.order.findUnique({
        where: { id: result.merchantInvoiceNumber },
      });

      await sendPaymentNotification(
        order?.customerId!,
        result.merchantInvoiceNumber,
        result.amount,
      );

      return result;
    } else {
      return result;
    }
  } catch (error) {
    throw error;
  }
};

export const validateIndPayment = async (
  data: IndPayment,
  signature: string,
) => {
  try {

    // Verify the signature
    let isValid = false;
    try {
      isValid = validateSignature(signature, data);
    } catch (error) {
      throw new Error("Signature validation failed");
    }

    if (!isValid) {
      throw new Error("Invalid Signature");
    }

    if (data.event === "payment.captured" || data.event === "payment.authorized") {
      const payment = data.payload.payment.entity;

      // Find the payment record by razorPayId
      const paymentRecord = await db.payment.findFirst({
        where: { razorPayId: payment.order_id },
      });

      if (!paymentRecord) {
        console.error(`Payment record not found for order_id: ${payment.order_id}`);
        throw new Error("Payment record not found");
      }

      // Update the payment status
      await db.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: PaymentStatus.PAID,
          vendor: Vendor.RAZORPAY,
          transId: payment.id,
          currency: payment.currency,
          amount: payment.amount / 100,
        },
      });

      // Get the order to send notification
      const order = await db.order.findUnique({
        where: { id: paymentRecord.orderId },
      });

      if (order) {
        await sendPaymentNotification(
          order.customerId,
          paymentRecord.orderId,
          (payment.amount / 100).toString(),
        );
      }

      return { success: true, message: "Payment validated successfully" };
    } else if (data.event === "payment.failed") {
      // Handle failed payment
      const payment = data.payload.payment.entity;

      // Find the payment record
      const paymentRecord = await db.payment.findFirst({
        where: { razorPayId: payment.order_id },
      });

      if (paymentRecord) {
        await db.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: PaymentStatus.FAILED,
            transId: payment.id,
          },
        });
      }

      return { success: false, message: "Payment failed" };
    } else {
      // For other events, just acknowledge receipt
      return { success: true, message: `Event ${data.event} received` };
    }
  } catch (error) {
    console.error("Error in validateIndPayment:", error);
    throw error;
  }
};

export const fetchPaymentsByCustomerId = async (
  customerId: string,
  page: number = 1,
  pageSize: number = 10,
  q?: string,
  status?: PaymentStatus,
) => {
  try {
    const where: Prisma.PaymentWhereInput = {
      customerId: customerId,
    };

    if (q) {
      where.transId = { contains: q, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    const totalPayments = await db.payment.count({ where });

    const payments = await db.payment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        transId: true,
        amount: true,
        currency: true,
        status: true,
        vendor: true,
        createdAt: true,
        order: {
          select: {
            id: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalPayments / pageSize);

    return {
      pageNumber: page,
      pageSize,
      totalPayments,
      totalPages,
      payments: payments,
    };
  } catch (error) {
    throw new Error("Error fetching payments by customer ID.");
  }
};

export const fetchAllPayments = async (options: PaymentsQueryOptions) => {
  const skip = (options.page - 1) * options.limit;
  try {
    const dateRange = parseDateRange(options.dateRange);

    const where: Prisma.PaymentWhereInput = {
      ...(options.q && {
        OR: [
          {
            transId: {
              contains: options.q,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(options.status && {
        status: options.status,
      }),
      ...(options.vendor && {
        vendor: options.vendor,
      }),
      ...(options.nationality && {
        customer: {
          nationality: options.nationality,
        },
      }),
      ...(dateRange && {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      }),
    };

    const totalPayments = await db.payment.count({ where });

    const payments = await db.payment.findMany({
      where,
      skip,
      take: options.limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        transId: true,
        amount: true,
        orderId: true,
        currency: true,
        status: true,
        vendor: true,
        createdAt: true,
        customer: {
          select: {
            nationality: true,
          },
        },
        order: {
          select: {
            id: true,
          },
        },
      },
    });

    return {
      payments,
      totalPayments,
      totalPages: Math.ceil(totalPayments / options.limit),
      currentPage: options.page,
    };
  } catch (error) {
    throw new Error("Error fetching all payments.");
  }
};

export const fetchPaymentById = async (id: string) => {
  try {
    const payment = await db.payment.findUnique({
      where: { id: id },
      select: {
        id: true,
        transId: true,
        amount: true,
        currency: true,
        status: true,
        vendor: true,
        createdAt: true,
        order: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!payment) {
      throw new Error("Payment not found.");
    }
    return payment;
  } catch (error) {
    throw new Error("Error fetching payment by ID.");
  }
};
