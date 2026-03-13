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

// Common include for order items with request item details
const orderItemsInclude = {
  items: {
    include: {
      requestItem: {
        select: {
          productName: true,
          productUrl: true,
          description: true,
          image: true,
          quantity: true,
          productCost: true,
          internationalShippingCost: true,
          localShippingCost: true,
          miscellaneousCost: true,
          totalCost: true,
          estimatedDeliveryDate: true,
        },
      },
    },
  },
};

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
        ...orderItemsInclude,
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
        ...orderItemsInclude,
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
        ...orderItemsInclude,
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
  createOrderData: CreateOrder["body"],
) => {
  try {
    const customer = await findCustomerById(customerId);

    if (!customer?.isVerified) {
      throw new Error("Customer not verified");
    }

    // Validate the request exists
    const request = await db.request.findUnique({
      where: { id: createOrderData.requestId },
      include: { items: true },
    });

    if (!request) {
      throw new Error("Request not found.");
    }

    // Fetch and validate each requested item
    const requestItems = await db.requestItem.findMany({
      where: {
        id: { in: createOrderData.items },
        requestId: createOrderData.requestId,
      },
    });

    if (requestItems.length !== createOrderData.items.length) {
      throw new Error(
        "One or more request items not found or do not belong to this request.",
      );
    }

    // Ensure all selected items are approved
    for (const item of requestItems) {
      if (item.status !== RequestStatus.APPROVED) {
        throw new Error(
          `Request item "${item.productName || item.id}" is not approved.`,
        );
      }
    }

    // Calculate total cost from selected items
    const totalAmount = requestItems.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0,
    );

    const order = await db.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          id: generateId(SysEntities.ORDER),
          customerId,
          requestId: createOrderData.requestId,
          house: createOrderData.house,
          road: createOrderData.road,
          thana: createOrderData.thana,
          district: createOrderData.district,
          totalCost: totalAmount,
          mapLink: createOrderData.mapLink,
          postalCode: createOrderData.postalCode,
          street: createOrderData.street,
        },
      });

      // Create order items
      for (const item of requestItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            requestItemId: item.id,
            quantity: item.quantity,
            price: item.totalCost || 0,
          },
        });
      }

      // Create payment
      await tx.payment.create({
        data: {
          id: generateId(SysEntities.PAYMENT),
          orderId: newOrder.id,
          customerId,
        },
      });

      // Create order status log
      await tx.orderStatusLog.create({
        data: {
          orderId: newOrder.id,
          oldStatus: null,
          newStatus: OrderStatus.PENDING,
          updatedBy: customerId,
        },
      });

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          customer: true,
          ...orderItemsInclude,
        },
      });
    });

    await createAdminNotification(
      `A New order has been placed`,
      `A order has been placed by ${order!.customer.firstName} ${order!.customer.lastName}`,
      order!.id,
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
      include: {
        ...orderItemsInclude,
      },
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

    // Get a summary of product names from order items
    const productNames = order.items
      .map((item) => item.requestItem.productName)
      .filter(Boolean)
      .join(", ");

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
          ...orderItemsInclude,
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
      productNames || "Multiple items",
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
