import { Role } from "@prisma/client";

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image?: string;
  role: Role;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
