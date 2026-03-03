import { db } from "@/db";
import {
  NATIONALITY,
  NotificationRequestType,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  Prisma,
  RequestStatus,
} from "@prisma/client";
import {
  createBkashPayment,
  initiateIndianPaymentService,
} from "./payments.service";
import { CreateOrder, UpdateOrder } from "@/validations/order";

import {
  createAdminNotification,
  createCustomerNotification,
} from "./notifications.service";
import { OrdersQueryOptions } from "@/types/orders";
import { findCustomerById } from "./customers.service";
import { sendOrderStatusNotification } from "./notification-delivery.service";
import { generateId, parseDateRange } from "@/utils/helper-fns";
import { SysEntities } from "@/utils/constants";
import { getToken } from "@/utils/bkash-auth";

export const getOrdersByCustomerId = async (
  id: string,
  page: number = 1,
  pageSize: number = 10,
  q?: string,
  status?: OrderStatus,
  dateRange?: string,
) => {
  try {
    const where: Prisma.OrderWhereInput = {
      customerId: id,
    };

    if (q) {
      where.id = { contains: q, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    // Add date range filter
    if (dateRange) {
      const parsedDateRange = parseDateRange(dateRange);
      if (parsedDateRange) {
        where.createdAt = {
          gte: parsedDateRange.from,
          lte: parsedDateRange.to,
        };
      }
    }

    const totalItems = await db.order.count({ where });

    const orders = await db.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        payments: {
          select: {
            status: true,
          },
        },
        request: {
          select: {
            quantity: true,
            productCost: true,
            productUrl: true,
            internationalShippingCost: true,
            localShippingCost: true,
            miscellaneousCost: true,
            totalCost: true,
            productName: true,
            image: true,
            description: true,
            estimatedDeliveryDate: true,
          },
        },
        orderStatusLog: {
          select: {
            oldStatus: true,
            newStatus: true,
            updatedBy: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      pageNumber: page,
      pageSize,
      totalItems,
      totalPages,
      data: orders,
    };
  } catch (error) {
    throw new Error("Error fetching orders.");
  }
};

export const getOrderDetails = async (id: string) => {
  try {
    const orders = await db.order.findUnique({
      where: {
        id,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            nationality: true,
            email: true,
            phone: true,
          },
        },
        request: {
          select: {
            quantity: true,
            productCost: true,
            productUrl: true,
            internationalShippingCost: true,
            localShippingCost: true,
            miscellaneousCost: true,
            totalCost: true,
            productName: true,
            image: true,
            description: true,
            estimatedDeliveryDate: true,
          },
        },
        payments: {
          select: {
            status: true,
            amount: true,
            transId: true,
          },
        },
        orderStatusLog: {
          select: {
            oldStatus: true,
            newStatus: true,
            updatedBy: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
    if (!orders) {
      throw new Error("Order not found.");
    }
    return orders;
  } catch (error) {
    throw new Error("Error fetching order by ID.");
  }
};

export const getOrders = async (options: OrdersQueryOptions) => {
  const skip = (options.page - 1) * options.limit;
  try {
    const dateRange = parseDateRange(options.dateRange);

    const where: Prisma.OrderWhereInput = {
      ...(options.q && {
        OR: [
          {
            id: {
              contains: options.q,
              mode: "insensitive",
            },
          },
          {
            customer: {
              firstName: {
                contains: options.q,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
      ...(options.status && {
        status: options.status as OrderStatus,
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

    const totalOrders = await db.order.count({ where });

    const orders = await db.order.findMany({
      where,
      skip,
      take: options.limit,
      include: {
        payments: {
          select: {
            status: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            nationality: true,
          },
        },
        orderStatusLog: {
          select: {
            oldStatus: true,
            newStatus: true,
            updatedBy: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        request: {
          select: {
            productName: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / options.limit),
      currentPage: options.page,
    };
  } catch (error) {
    throw new Error("Error fetching orders.");
  }
};

export const createOrder = async (
  customerId: string,
  createOrder: CreateOrder["body"],
) => {
  try {
    const request = await db.request.findUnique({
      where: { id: createOrder.requestId },
    });

    const customer = await findCustomerById(customerId);

    if (!customer?.isVerified) {
      throw new Error("Customer not verified");
    }
    if (!request) {
      throw new Error("Request not found.");
    }

    if (request.status !== RequestStatus.APPROVED) {
      throw new Error("Request not approved.");
    }

    const totalAmount = request.totalCost;

    const order = await db.order.create({
      data: {
        id: generateId(SysEntities.ORDER),
        customerId,
        requestId: createOrder.requestId,
        house: createOrder.house,
        road: createOrder.road,
        thana: createOrder.thana,
        district: createOrder.district,
        totalCost: totalAmount ? totalAmount : 0,
        mapLink: createOrder.mapLink,
        postalCode: createOrder.postalCode,
        street: createOrder.street,
      },
      include: {
        customer: true,
      },
    });

    // Create payment
    await db.payment.create({
      data: {
        id: generateId(SysEntities.PAYMENT),
        orderId: order.id,
        customerId,
      },
    });

    // Create order status log
    await db.orderStatusLog.create({
      data: {
        orderId: order.id,
        oldStatus: null,
        newStatus: OrderStatus.PENDING,
        updatedBy: customerId,
      },
    });

    //update request order Id
    await db.request.update({
      where: {
        id: createOrder.requestId,
      },
      data: {
        orderId: order.id,
      },
    });

    await createAdminNotification(
      `A New order has been placed`,
      `A order has been placed by ${order.customer.firstName} ${order.customer.lastName}`,
      order.id,
      NotificationType.ORDER,
      NotificationRequestType.POSITIVE,
    );

    return order;
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    throw new Error(errMessage);
  }
};

export const initiatePayment = async (orderId: string, userId: string) => {
  try {
    const order = await getOrderDetails(orderId);
    if (!order) {
      throw new Error("Order not found.");
    }
    if (order.customerId !== userId) {
      throw new Error("Not authorized.");
    }
    if (order.payments?.status == PaymentStatus.PAID) {
      throw new Error("Already paid");
    }
    if (order.status == OrderStatus.CANCELED) {
      throw new Error("Order canceled");
    }

    let response = {};

    if (order.customer?.nationality == NATIONALITY.BANGLADESH) {
      const token = await getToken();

      response = await createBkashPayment(order.totalCost, token, order.id);
    } else {
      response = await initiateIndianPaymentService(order.totalCost, order.id);
    }

    return response;
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    throw new Error(errMessage);
  }
};

export const updatOrderById = async (
  id: string,
  data: UpdateOrder["body"],
  updatedBy: string,
) => {
  try {
    const order = await db.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    // If no status is provided, just return the current order
    if (!data.status) {
      return order;
    }

    if (order.status === data.status) {
      throw new Error("Order already in that status.");
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new Error("Order already delivered.");
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELED],
      [OrderStatus.PROCESSING]: [OrderStatus.BOUGHT, OrderStatus.CANCELED],
      [OrderStatus.BOUGHT]: [OrderStatus.SHIPPED, OrderStatus.CANCELED],
      [OrderStatus.SHIPPED]: [
        OrderStatus.RECEIVED_SHIPMENT,
        OrderStatus.CANCELED,
      ],
      [OrderStatus.RECEIVED_SHIPMENT]: [
        OrderStatus.ON_DELIVERY,
        OrderStatus.CANCELED,
      ],
      [OrderStatus.ON_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.CANCELED]: [],
    };

    if (!validTransitions[order.status].includes(data.status)) {
      throw new Error(
        `Invalid status transition from ${order.status} to ${data.status}`,
      );
    }

    const [updatedOrder] = await db.$transaction([
      db.order.update({
        where: { id },
        data: {
          status: data.status,
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          request: {
            select: {
              productName: true,
            },
          },
        },
      }),
      db.orderStatusLog.create({
        data: {
          orderId: id,
          oldStatus: order.status,
          newStatus: data.status,
          updatedBy,
        },
      }),
    ]);

    await createCustomerNotification(
      `Order status ${data.status}`,
      ``,
      updatedOrder.id,
      updatedOrder.customerId,
      NotificationType.ORDER,
      NotificationRequestType.POSITIVE,
    );

    // Send order status update notification
    await sendOrderStatusNotification(
      updatedOrder.customerId!,
      `${updatedOrder.customer.firstName} ${updatedOrder.customer.lastName}`,
      updatedOrder.request.productName!,
      updatedOrder.id,
      data.status!,
    );

    return updatedOrder;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error updating order by ID.",
    );
  }
};
