import { NATIONALITY, OrderStatus } from "@prisma/client";

export interface OrdersQueryOptions {
  page: number;
  limit: number;
  q?: string;
  status?: OrderStatus;
  dateRange?: string;
  nationality?: NATIONALITY;
}
