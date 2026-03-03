import { z } from "zod";

export const banPaymentValidateSchema = z.object({
  body: z.object({
    val_id: z.string(),
    tran_id: z.string(),
    status: z.string(),
    amount: z.string().min(1, { message: "Amount is required" }),
    currency: z.string().min(1, { message: "Currency is required" }),
  }),
});


export const inPaymentWebhookValidateSchema = z.object({
  entity: z.literal("event"),
  account_id: z.string(),
  event: z.string().min(1),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.enum(["created", "authorized", "captured", "refunded", "failed"]),
        email: z.string().optional(),
        contact: z.string().optional(),
      }),
    }),
    order: z.object({
      entity: z.any(),
    }),
  }),
  created_at: z.number(),
}).passthrough(); // Allow additional fields that Razorpay might send

export type BanPayment = z.infer<typeof banPaymentValidateSchema>;
export type IndPayment = z.infer<typeof inPaymentWebhookValidateSchema>;

