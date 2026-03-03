import { TicketStatus } from "@prisma/client";
import { z } from "zod";

export const creatTicketSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    status: z.enum([TicketStatus.RESOLVED], {
      message: "Ticket staus must be resolved",
    }),
  }),
});

export type CreateSupportTicket = z.infer<typeof creatTicketSchema>;
export type UpdateSupportTicket = z.infer<typeof updateTicketSchema>;
