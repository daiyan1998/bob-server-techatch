import { PASSWORD_LENGTH } from "@/utils/constants";
import { Role } from "@prisma/client";
import { z } from "zod";

export const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email({ message: "Must be a valid email address." })
      .trim(),
    password: z
      .string()
      .min(PASSWORD_LENGTH, {
        message: `Password must be at least ${PASSWORD_LENGTH} characters long.`,
      })
      .max(100, { message: "Password must not exceed 100 characters." })
      .trim(),
  }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(1, { message: "First name cannot be empty." })
        .trim()
        .optional(),
      lastName: z
        .string()
        .min(1, { message: "Last name cannot be empty." })
        .trim()
        .optional(),
      email: z
        .string()
        .email({ message: "Must be a valid email address." })
        .trim()
        .optional(),
      phone: z
        .string()
        .min(11, { message: "Phone number must be at least 11 digits." })
        .optional(),
      role: z.enum([Role.MANAGER, Role.EDITOR]).optional(),
    })
    .strict(),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z
        .string()
        .min(PASSWORD_LENGTH, { message: "Old password is required." })
        .trim(),
      newPassword: z
        .string()
        .min(PASSWORD_LENGTH, {
          message: `New password must be at least ${PASSWORD_LENGTH} characters long.`,
        })
        .max(100, { message: "New password must not exceed 100 characters." })
        .trim(),
    })
    .strict(),
});

export const createAdminUserSchema = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, { message: "First name cannot be empty." })
        .max(50),
      lastName: z
        .string()
        .min(2, { message: "Last name cannot be empty." })
        .max(50),
      email: z.string().email({ message: "Must be a valid email address." }),
      phone: z
        .string()
        .min(11, { message: "Phone number must be at least 11 digits." }),
      password: z.string().min(PASSWORD_LENGTH, {
        message: `password must be at least ${PASSWORD_LENGTH} characters long.`,
      }),
      role: z.enum([Role.MANAGER, Role.EDITOR]),
    })
    .strict(),
});

export const changePasswordByAdminSchema = z.object({
  body: z
    .object({
      newPassword: z
        .string()
        .min(PASSWORD_LENGTH, {
          message: `New password must be at least ${PASSWORD_LENGTH} characters long.`,
        })
        .max(100, { message: "New password must not exceed 100 characters." })
        .trim(),
    })
    .strict(),
});

export const userIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid({ message: "Invalid userId format" }),
  }),
});

export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
export type UpdatePassword = z.infer<typeof changePasswordSchema>;
export type UpdatePasswordByAdmin = z.infer<typeof changePasswordByAdminSchema>;
export type UserIdParams = z.infer<typeof userIdSchema>;
