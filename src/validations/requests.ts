import { RequestStatus, RequestType } from "@prisma/client";
import { z } from "zod";

export const getRequestSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    status: z
      .preprocess(
        (value) => (Array.isArray(value) ? value : value ? [value] : []),
        z.array(
          z.enum([
            RequestStatus.APPROVED,
            RequestStatus.CANCELED,
            RequestStatus.PENDING,
            RequestStatus.REJECTED,
          ]),
        ),
      )
      .optional(),
    type: z
      .enum([RequestType.DIRECT, RequestType.LINK], {
        message: "Request type must be either Direct or Link.",
      })
      .optional(),
    dateRange: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const createRequestSchema = z.object({
  body: z.object({
    productUrl: z.string().optional(),
    productName: z
      .string()
      .min(1, { message: "Product name cannot be empty" })
      .trim()
      .optional(),
    description: z.string().optional(),
    quantity: z.coerce.number().optional().default(1),
    requestType: z.enum([RequestType.DIRECT, RequestType.LINK], {
      message: "Request type must be either Direct or Link.",
    }),
  }),
});

export const updateRequestByAdminSchema = z.object({
  body: z.object({
    productCost: z.coerce.number().positive().optional(),
    internationalShippingCost: z.coerce.number().nonnegative().optional(),
    localShippingCost: z.coerce.number().nonnegative().optional(),
    miscellaneousCost: z.coerce.number().nonnegative().optional(),
    status: z.nativeEnum(RequestStatus).optional(),
    adminNotes: z.string().optional(),
    estimatedDeliveryDate: z.coerce.date().optional(),
  }),
});

export const updateRequestByUserSchema = z.object({
  body: z.object({
    status: z.enum([RequestStatus.CANCELED], {
      message: "Request type must Canceled.",
    }),
    customerNotes: z.string().optional(),
  }),
});

export type CreateRequest = z.infer<typeof createRequestSchema>;
export type UpdateRequest = z.infer<typeof updateRequestByAdminSchema>;
