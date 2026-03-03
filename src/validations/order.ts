import { OTP_LENGTH, PASSWORD_LENGTH } from "@/utils/constants";
import { OrderStatus, RequestStatus, RequestType } from "@prisma/client";
import { z } from "zod";

export const getOrderSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    status: z
      .enum(
        [
          OrderStatus.PENDING,
          OrderStatus.PROCESSING,
          OrderStatus.BOUGHT,
          OrderStatus.SHIPPED,
          OrderStatus.RECEIVED_SHIPMENT,
          OrderStatus.ON_DELIVERY,
          OrderStatus.DELIVERED,
          OrderStatus.REFUNDED,
          OrderStatus.CANCELED,
        ],
        {
          message:
            "Status must be either Pending,Processing,Shipped or Delivered.",
        },
      )
      .optional(),
    dateRange: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    q: z.string().optional(),
    status: z
      .enum(
        [
          OrderStatus.PENDING,
          OrderStatus.PROCESSING,
          OrderStatus.BOUGHT,
          OrderStatus.SHIPPED,
          OrderStatus.RECEIVED_SHIPMENT,
          OrderStatus.ON_DELIVERY,
          OrderStatus.DELIVERED,
        ],
        {
          message: "Status must be a valid order status.",
        },
      )
      .optional(),
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    house: z.string(),
    road: z.string().optional(),
    street: z.string().optional(),
    thana: z.string().optional(),
    district: z.string(),
    postalCode: z.string(),
    mapLink: z.string(),
    requestId: z.coerce.string(),
  }),
});

export type CreateOrder = z.infer<typeof createOrderSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
