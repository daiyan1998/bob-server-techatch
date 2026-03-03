import { RefundReason, RefundStatus } from "@prisma/client";
import { z } from "zod";

export const createRefundRequestSchema = z.object({
  body: z.object({
    orderId: z.string().nonempty("Order ID is required"),
    reason: z.nativeEnum(RefundReason, {
      errorMap: () => ({ message: "Invalid refund reason" }),
    }),
    description: z.string().optional(),
    attachments: z.array(z.string()).optional(),
  }),
});

export const processRefundRequestSchema = z.object({
  body: z.object({
    status: z.nativeEnum(RefundStatus, {
      errorMap: () => ({ message: "Invalid refund status" }),
    }).refine(
      (val) => val === RefundStatus.APPROVED || val === RefundStatus.REJECTED,
      { message: "Status must be either APPROVED or REJECTED" }
    ),
    adminNotes: z.string().optional(),
    refundMethod: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});

export const getRefundRequestsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(RefundStatus, {
      errorMap: () => ({ message: "Invalid refund status" }),
    }).optional(),
    orderId: z.string().optional(),
    customerId: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    pageSize: z.string().optional().transform(val => val ? parseInt(val) : 10),
  }).optional(),
});

export type CreateRefundRequest = z.infer<typeof createRefundRequestSchema>;
export type ProcessRefundRequest = z.infer<typeof processRefundRequestSchema>;
export type GetRefundRequests = z.infer<typeof getRefundRequestsSchema>;
