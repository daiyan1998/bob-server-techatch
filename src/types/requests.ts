import { NATIONALITY, RequestStatus, RequestType } from "@prisma/client";

export interface RequestsQueryOptions {
  page: number;
  limit: number;
  q?: string;
  status?: RequestStatus;
  type?: RequestType;
  dateRange?: string;
  nationality?: NATIONALITY;
}
