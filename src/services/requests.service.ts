import { db } from "@/db";
import path from "path";
import {
  NotificationRequestType,
  NotificationType,
  Prisma,
  RequestStatus,
  RequestType,
} from "@prisma/client";
import {
  CreateRequest,
  UpdateRequest,
  UpdateRequestItem,
} from "@/validations/requests";
import { RequestsQueryOptions } from "@/types/requests";
import {
  createAdminNotification,
  createCustomerNotification,
} from "./notifications.service";
import { findCustomerById } from "./customers.service";

import { sendRequestStatusNotification } from "./notification-delivery.service";

import { generateId, parseDateRange } from "@/utils/helper-fns";

import { SysEntities } from "@/utils/constants";

export const createProductRequest = async (
  data: CreateRequest["body"] & { image?: string },
  customerId: string,
  imageFile?: Express.Multer.File,
) => {
  try {
    if (imageFile) {
      data.image = path.posix.join("/public/tmp", imageFile.filename);
    }

    const customer = await findCustomerById(customerId);

    if (!customer?.isVerified) {
      throw new Error("Customer not verified");
    }

    const request = await db.$transaction(async (tx) => {
      // Create the request (parent)
      const newRequest = await tx.request.create({
        data: {
          id: generateId(SysEntities.PRODUCT_REQUEST),
          customerId: customerId,
          status: RequestStatus.PENDING,
          requestType: data.requestType,
        },
      });

      // Create request items
      for (const item of data.items) {
        await tx.requestItem.create({
          data: {
            id: generateId(SysEntities.REQUEST_ITEM),
            requestId: newRequest.id,
            productUrl: item.productUrl,
            productName: item.productName,
            description: item.description,
            quantity: parseInt(`${item.quantity}`),
            image: data.image,
          },
        });
      }

      // Return with items and customer
      return tx.request.findUnique({
        where: { id: newRequest.id },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    await createAdminNotification(
      "A new product has been requested",
      `A product has been requested by ${request!.customer.firstName} ${request!.customer.lastName}`,
      request!.id.toString(),
      NotificationType.REQUEST,
      NotificationRequestType.POSITIVE,
    );

    return request;
  } catch (error) {
    const errMessage =
      error instanceof Error
        ? error.message
        : "Error creating product request.";
    throw new Error(errMessage);
  }
};

export const getRequestsByCustomerId = async (
  customerId: string,
  page: number = 1,
  pageSize: number = 10,
  q?: string,
  statuses?: RequestStatus[],
  type?: RequestType,
  dateRange?: string,
) => {
  try {
    const where: Prisma.RequestWhereInput = {
      customerId: customerId,
    };

    if (q) {
      where.items = {
        some: {
          productName: { contains: q, mode: "insensitive" },
        },
      };
    }

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (type) {
      where.requestType = type;
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

    const totalItems = await db.request.count({ where });

    const requests = await db.request.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
      },
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      pageNumber: page,
      pageSize,
      totalItems,
      totalPages,
      data: requests,
    };
  } catch (error) {
    throw new Error("Error fetching requests by customer ID.");
  }
};

export const getAllRequests = async (options: RequestsQueryOptions) => {
  const skip = (options.page - 1) * options.limit;
  try {
    const dateRange = parseDateRange(options.dateRange);

    const where: Prisma.RequestWhereInput = {
      ...(options.q && {
        OR: [
          {
            customer: {
              firstName: {
                contains: options.q,
                mode: "insensitive",
              },
            },
          },

          {
            id: {
              contains: options.q,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(options.status && {
        status: options.status,
      }),
      ...(options.type && {
        requestType: options.type,
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

    const totalRequests = await db.request.count({ where });

    const requests = await db.request.findMany({
      where,
      skip,
      take: options.limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            nationality: true,
          },
        },
        items: true,
      },
    });

    return {
      requests,
      totalRequests,
      totalPages: Math.ceil(totalRequests / options.limit),
      currentPage: options.page,
    };
  } catch (error) {
    throw new Error("Error fetching all requests.");
  }
};

export const getRequestById = async (id: string) => {
  try {
    const request = await db.request.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            nationality: true,
            address: true,
          },
        },
        items: true,
      },
    });
    if (!request) {
      throw new Error("Request not found.");
    }
    return request;
  } catch (error) {
    throw new Error("Error fetching request by ID.");
  }
};

/**
 * Update a request item by its ID (admin action).
 * Used for per-item approval/rejection and setting costs.
 */
export const updateRequestItemById = async (
  requestId: string,
  itemId: string,
  data: UpdateRequestItem["body"],
  userId?: string,
) => {
  try {
    const requestItem = await db.requestItem.findUnique({
      where: { id: itemId },
      include: { request: true },
    });

    if (!requestItem) {
      throw new Error("Request item not found.");
    }

    if (requestItem.requestId !== requestId) {
      throw new Error("Request item does not belong to this request.");
    }

    // Check if status is the same (only if status is provided)
    if (data.status && requestItem.status === data.status) {
      throw new Error("Request item already in that status.");
    }

    // Initialize update data object
    const updateData: Prisma.RequestItemUpdateInput = {};

    // Handle cost fields only if they are provided
    if (data.productCost !== undefined) {
      updateData.productCost = parseInt(`${data.productCost}`) || 0;
    }

    if (data.internationalShippingCost !== undefined) {
      updateData.internationalShippingCost =
        parseInt(`${data.internationalShippingCost}`) || 0;
    }

    if (data.localShippingCost !== undefined) {
      updateData.localShippingCost = parseInt(`${data.localShippingCost}`) || 0;
    }

    if (data.miscellaneousCost !== undefined) {
      updateData.miscellaneousCost = parseInt(`${data.miscellaneousCost}`) || 0;
    }

    // Add other fields to update data
    if (data.status) {
      updateData.status = data.status;
    }

    if (data.adminNotes !== undefined) {
      updateData.adminNotes = data.adminNotes;
    }

    if (data.estimatedDeliveryDate) {
      updateData.estimatedDeliveryDate = data.estimatedDeliveryDate;
    }

    // Calculate total cost only if any cost field is provided
    const costFieldsProvided = [
      "productCost",
      "internationalShippingCost",
      "localShippingCost",
      "miscellaneousCost",
    ].some((field) => data[field as keyof typeof data] !== undefined);

    if (costFieldsProvided) {
      // Use existing values for any fields not provided
      const productCost =
        data.productCost !== undefined
          ? parseInt(`${data.productCost}`) || 0
          : requestItem.productCost || 0;

      const internationalShippingCost =
        data.internationalShippingCost !== undefined
          ? parseInt(`${data.internationalShippingCost}`) || 0
          : requestItem.internationalShippingCost || 0;

      const localShippingCost =
        data.localShippingCost !== undefined
          ? parseInt(`${data.localShippingCost}`) || 0
          : requestItem.localShippingCost || 0;

      const miscellaneousCost =
        data.miscellaneousCost !== undefined
          ? parseInt(`${data.miscellaneousCost}`) || 0
          : requestItem.miscellaneousCost || 0;

      const totalCost =
        productCost +
        internationalShippingCost +
        localShippingCost +
        miscellaneousCost;

      // Only validate total cost if we're actually updating cost fields
      if (totalCost < 1) {
        throw new Error("Total cost cannot be less than 1");
      }

      updateData.totalCost = totalCost;
    }

    // If no fields to update, return the current request item
    if (Object.keys(updateData).length === 0) {
      return requestItem;
    }

    const updatedItem = await db.requestItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        request: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const customer = updatedItem.request.customer;

    if (data.status) {
      await createCustomerNotification(
        `Admin ${data.status} your request item`,
        "",
        updatedItem.request.id.toString(),
        requestItem.request.customerId,
        NotificationType.REQUEST,
        data.status === RequestStatus.CANCELED ||
          data.status === RequestStatus.REJECTED
          ? NotificationRequestType.NEGATIVE
          : NotificationRequestType.POSITIVE,
      );

      if (data.status === RequestStatus.APPROVED) {
        await sendRequestStatusNotification(
          requestItem.request.customerId,
          data.status,
          updatedItem.request.requestType === RequestType.DIRECT
            ? `${updatedItem.description}`
            : `${updatedItem.productUrl}`,
          (updatedItem.totalCost || 0).toString(),
          updatedItem.adminNotes || "",
        );
      }
    }

    return updatedItem;
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Error updating request item.";
    throw new Error(errMessage);
  }
};

/**
 * Update a request at the top level (e.g. customer cancellation).
 * Kept for backward compatibility.
 */
export const updateRequestById = async (
  id: string,
  data: UpdateRequest["body"],
  userId?: string,
) => {
  try {
    const request = await db.request.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!request) {
      throw new Error("Request not found.");
    }

    // Check if status is the same (only if status is provided)
    if (data.status && request.status === data.status) {
      throw new Error("Request already in that status.");
    }

    const updateData: Prisma.RequestUpdateInput = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      return request;
    }

    const updatedRequest = await db.request.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: true,
      },
    });

    const user = await db.customer.findUnique({
      where: { id: userId },
    });

    if (user) {
      await createAdminNotification(
        `Customer ${data.status || request.status} your request`,
        "",
        updatedRequest.id.toString(),
        NotificationType.REQUEST,
        (data.status || request.status) === RequestStatus.CANCELED
          ? NotificationRequestType.NEGATIVE
          : NotificationRequestType.POSITIVE,
      );
    } else if (data.status) {
      await createCustomerNotification(
        `Admin ${data.status} your request`,
        "",
        updatedRequest.id.toString(),
        updatedRequest.customerId!,
        NotificationType.REQUEST,
        data.status === RequestStatus.CANCELED ||
          data.status === RequestStatus.REJECTED
          ? NotificationRequestType.NEGATIVE
          : NotificationRequestType.POSITIVE,
      );
    }

    return updatedRequest;
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Error updating request by ID.";
    throw new Error(errMessage);
  }
};
