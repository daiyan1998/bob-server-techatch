import { NotificationRequestType, NotificationType, Prisma, RefundReason, RefundStatus, Vendor } from "@prisma/client";
import { db } from "@/db";
import { razorpay } from "@/utils/razorpay";
import { getToken } from "@/utils/bkash-auth";
import { createAdminNotification, createCustomerNotification } from "./notifications.service";



/**
 * Create a new refund request
 */
export const createRefundRequest = async (data: {
  orderId: string;
  customerId: string;
  reason: RefundReason;
  description?: string;
  attachments?: string[];
}) => {
  // Validate order exists and belongs to customer
  const order = await db.order.findUnique({
    where: { id: data.orderId },
    include: {
      payments: true
    }
  });

  if (!order) {
    throw new Error(`Order with ID ${data.orderId} not found`);
  }

  if (order.customerId !== data.customerId) {
    throw new Error("Order does not belong to this customer");
  }

  // Check if order is already fully refunded
  if (order.isRefunded) {
    throw new Error("This order has already been refunded");
  }

  // Calculate refundable amount (total order cost minus already refunded amount)
  const refundableAmount = order.totalCost - (order.refundedAmount || 0);

  if (refundableAmount <= 0) {
    throw new Error("No refundable amount available for this order");
  }

  // Create refund request with the refundable amount
  const refundRequest = await db.refundRequest.create({
    data: {
      orderId: data.orderId,
      customerId: data.customerId,
      amount: refundableAmount,
      reason: data.reason,
      description: data.description,
      attachments: data.attachments || [],
      status: RefundStatus.PENDING,
    },
    include: {
      order: true,
      customer: true,
    },
  });

  // Notify admin about new refund request
  // TODO: Implement admin notification
  await createAdminNotification(
    "A new refund request has been created",
    `A refund request has been created for order ID: ${data.orderId}`,
    refundRequest.id,
    NotificationType.REFUND,
    NotificationRequestType.NEGATIVE,
  );

  return refundRequest;
};

/**
 * Get all refund requests with optional filters and pagination
 */
export const getRefundRequests = async (
  filters?: {
    customerId?: string;
    orderId?: string;
    status?: RefundStatus;
  },
  page: number = 1,
  pageSize: number = 10
) => {
  try {
    const where: Prisma.RefundRequestWhereInput = {
      ...(filters?.customerId && { customerId: filters.customerId }),
      ...(filters?.orderId && { orderId: filters.orderId }),
      ...(filters?.status && { status: filters.status }),
    };

    // Count total items for pagination
    const totalItems = await db.refundRequest.count({ where });

    // Get paginated refund requests
    const refundRequests = await db.refundRequest.findMany({
      where,
      include: {
        order: true,
        customer: true,
      },
      orderBy: {
        requestedAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      pageNumber: page,
      pageSize,
      totalItems,
      totalPages,
      data: refundRequests,
    };
  } catch (error) {
    throw new Error("Error fetching refund requests");
  }
};

/**
 * Get refund request by ID
 */
export const getRefundRequestById = async (id: string) => {
  return db.refundRequest.findUnique({
    where: { id },
    include: {
      order: true,
    },
  });
};

/**
 * Process a refund request (approve or reject)
 */
export const processRefundRequest = async (
  id: string,
  adminId: string,
  data: {
    status: RefundStatus;
    adminNotes?: string;
    refundMethod?: string;
    transactionId?: string;
  }
) => {
  const refundRequest = await getRefundRequestById(id);

  if (!refundRequest) {
    throw new Error(`Refund request with ID ${id} not found`);
  }

  if (refundRequest.status !== RefundStatus.PENDING) {
    throw new Error(`Refund request has already been ${refundRequest.status.toLowerCase()}`);
  }

  // Update refund request
  const updatedRefundRequest = await db.$transaction(async (tx) => {
    // Update the refund request
    const updated = await tx.refundRequest.update({
      where: { id },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
        processedAt: new Date(),
        processedBy: adminId,
        refundMethod: data.refundMethod,
        transactionId: data.transactionId,
      },
      include: {
        order: true,
        customer: true,
      },
    });

    return updated;
  });

  if (data.status === RefundStatus.APPROVED) {
    await createCustomerNotification(
      "Your refund request has been approved",
      `Your refund request for order ID: ${updatedRefundRequest.order.id} has been approved`,
      updatedRefundRequest.id,
      updatedRefundRequest.customerId,
      NotificationType.REFUND,
      NotificationRequestType.POSITIVE,
    );
  } else if (data.status === RefundStatus.REJECTED) {

    await createCustomerNotification(
      "Your refund request has been rejected",
      `Your refund request for order ID: ${updatedRefundRequest.order.id} has been rejected`,
      updatedRefundRequest.id,
      updatedRefundRequest.customerId,
      NotificationType.REFUND,
      NotificationRequestType.NEGATIVE,
    );
  }

  // Process the actual refund through payment gateway if approved
  if (data.status === RefundStatus.APPROVED) {
    try {
      const payment = await db.payment.findFirst({
        where: { orderId: refundRequest.orderId },
      });

      if (payment) {
        if (payment.vendor === Vendor.BKASH) {
          const response = await refundBkash(
            refundRequest.amount,
            payment.transId!,
            payment.paymentId!,
            data.adminNotes || "Refund approved"
          );

          if (response.statusCode !== "0000") {
            throw new Error(`Failed to refund: ${response.message}`);
          }
          else {
            await db.refundRequest.update({
              where: { id },
              data: {
                transactionId: response.refundTrxID,
                status: RefundStatus.COMPLETED,
              },
            });
            await db.order.update({
              where: { id: refundRequest.orderId },
              data: {
                refundedAmount: {
                  increment: refundRequest.amount,
                },
                isRefunded: true,
              },
            });
          }

        } else if (payment.vendor === Vendor.RAZORPAY) {
          await refundRazorpay(
            refundRequest.amount,
            payment.razorPayId!,
            data.adminNotes || "Refund approved"
          );
        }
      }
    } catch (error) {
      console.error("Error refunding payment:", error);
    }
  }

  return updatedRefundRequest;
};

/**
 * Get refund statistics
 */
export const getRefundStats = async () => {
  const stats = await db.$transaction([
    db.refundRequest.count({ where: { status: RefundStatus.PENDING } }),
    db.refundRequest.count({ where: { status: RefundStatus.APPROVED } }),
    db.refundRequest.count({ where: { status: RefundStatus.REJECTED } }),
    db.refundRequest.aggregate({ _sum: { amount: true }, where: { status: RefundStatus.APPROVED } }),
  ]);

  return {
    pendingCount: stats[0],
    approvedCount: stats[1],
    rejectedCount: stats[2],
    totalRefundedAmount: stats[3]._sum.amount || 0,
  };
};


const refundBkash = async (amount: number, transactionId: string, paymentId: string, reason: string) => {
  try {
    const token = await getToken();

    const response = await fetch(
      `${process.env.BKASH_BASE_URL}/tokenized/checkout/payment/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "X-APP-Key": process.env.BKASH_APP_KEY || "",
        },
        body: JSON.stringify({
          amount: amount.toString(),
          trxID: transactionId,
          paymentID: paymentId,
          sku: "Refund",
          reason: reason,
        }),
      },
    );

    if (!response.ok) {

      throw new Error(`Failed to refund: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};


const refundRazorpay = async (amount: number, paymentId: string, reason: string) => {
  try {
    // Convert to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Use Promise-based approach instead of callback
    return new Promise((resolve, reject) => {
      razorpay.payments.refund(paymentId, {
        amount: amountInPaise,
        notes: {
          reason: reason,
        },
      }, (err: any, refund: any) => {
        if (err) {
          console.error("Razorpay refund error:", err);
          reject(err);
        } else {
          console.log("Razorpay refund success:", refund);
          resolve(refund);
        }
      });
    });
  } catch (error) {
    console.error("Error in refundRazorpay:", error);
    throw error;
  }
};

