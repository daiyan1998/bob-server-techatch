import { NATIONALITY, TicketStatus } from "@prisma/client";

export interface SupportTicketsQueryOptions {
  page: number;
  limit: number;
  q?: string;
  status?: TicketStatus;
  nationality?: NATIONALITY;
  dateRange?: string;
}
