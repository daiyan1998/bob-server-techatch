import { NATIONALITY, PaymentStatus, Vendor } from "@prisma/client";

export interface PaymentsQueryOptions {
  page: number;
  limit: number;
  q?: string;
  status?: PaymentStatus;
  vendor?: Vendor;
  nationality?: NATIONALITY;
  dateRange?: string;
}
