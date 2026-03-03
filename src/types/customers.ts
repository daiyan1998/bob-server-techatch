export interface CustomersQueryOptions {
  page: number;
  limit: number;
  q?: string;
  nationality?: string;
  verified?: boolean;
}
