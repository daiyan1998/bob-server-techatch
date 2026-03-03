import { OTP_LENGTH, PASSWORD_LENGTH } from "@/utils/constants";
import { NATIONALITY } from "@prisma/client";
import { z } from "zod";

export const loginCustomerSchema = z.object({
  body: z.object({
    // phone: z
    //   .string()
    //   .min(11, { message: "Phone number must be at least 11 digits." })
    //   .trim(),
    email: z.string().email({ message: "Must be a valid email address." }),
    password: z
      .string()
      .min(1, { message: `Password can not be empty` })
      .trim(),
  }),
});

export const createCustomerSchema = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, { message: "First name must be at least 1 character long." })
        .max(50, { message: "First name must be within 50 characters." }),
      lastName: z
        .string()
        .min(2, { message: "Last name must be at least 1 character long." })
        .max(50, { message: "Last name must be within 50 characters." }),
      email: z.string().email({ message: "Must be a valid email address." }),
      // phone: z.string().min(11, { message: "" }),
      nationality: z.enum([NATIONALITY.BANGLADESH, NATIONALITY.INDIA], {
        message: "Nationality must be either Bangladesh or India.",
      }),
      password: z
        .string()
        .min(PASSWORD_LENGTH, {
          message: `Password must be at least ${PASSWORD_LENGTH} characters long.`,
        })
        .regex(/[A-Z]/, {
          message: "Password must contain at least one uppercase letter.",
        })
        .regex(/[a-z]/, {
          message: "Password must contain at least one lowercase letter.",
        })
        .regex(/[0-9]/, {
          message: "Password must contain at least one number.",
        }),
    })
    .strict(),
});

export const verifyOtpSchema = z.object({
  body: z
    .object({
      otp: z.string().min(OTP_LENGTH, {
        message: `Otp must be at least ${OTP_LENGTH} digit`,
      }),
      // phone: z
      //   .string()
      //   .min(11, { message: "Phone number must be at least 11 digits." }),
      email: z.string().email({ message: "Must be a valid email address." }),
    })
    .strict(),
});

export const updateCustomerSchema = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .min(2, { message: "First name must be at least 2 characters long." })
        .max(50, { message: "First name must be within 50 characters." })
        .optional(),

      lastName: z
        .string()
        .min(2, { message: "Last name must be at least 2 characters long." })
        .max(50, { message: "Last name must be within 50 characters." })
        .optional(),

      email: z
        .string()
        .email({ message: "Must be a valid email address." })
        .optional(),

      nationality: z
        .enum([NATIONALITY.BANGLADESH, NATIONALITY.INDIA])
        .optional(),

      bio: z
        .string()
        .max(255, { message: "Bio must be within 255 characters." })
        .optional(),
      image: z.string().max(255).optional(),
      phone: z.string().min(11, { message: "Phone number must be at least 11 digits." }).optional(),
      address: z
        .object({
          house: z.string().optional(),
          road: z.string().optional(),
          street: z.string().optional(),
          thana: z.string().optional(),
          district: z.string().optional(),
          postalCode: z.string().optional(),
          mapLink: z.string().optional(),
        })
        .optional(),

      password: z
        .string()
        .min(PASSWORD_LENGTH, {
          message: `Password must be at least ${PASSWORD_LENGTH} characters long.`,
        })
        .regex(/[A-Z]/, {
          message: "Password must contain at least one uppercase letter.",
        })
        .regex(/[a-z]/, {
          message: "Password must contain at least one lowercase letter.",
        })
        .regex(/[0-9]/, {
          message: "Password must contain at least one number.",
        })
        .optional(),
    })
    .strict(),
});

export const forgotPasswordSchema = z.object({
  body: z
    .object({
      phone: z
        .string()
        .min(11, { message: "Phone number must be at least 11 digits." })
        .trim(),
    })
    .strict(),
});

export const verifyResetOtpSchema = z.object({
  body: z
    .object({
      phone: z
        .string()
        .min(11, { message: "Phone number must be at least 11 digits." })
        .trim(),
      otp: z.string().min(OTP_LENGTH, {
        message: `OTP must be at least ${OTP_LENGTH} digits.`,
      }),
      resetToken: z.string(),
    })
    .strict(),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      phone: z
        .string()
        .min(11, { message: "Phone number must be at least 11 digits." })
        .trim(),
      resetToken: z.string(),
      password: z
        .string()
        .min(PASSWORD_LENGTH, {
          message: `Password must be at least ${PASSWORD_LENGTH} characters long.`,
        })
        .regex(/[A-Z]/, {
          message: "Password must contain at least one uppercase letter.",
        })
        .regex(/[a-z]/, {
          message: "Password must contain at least one lowercase letter.",
        })
        .regex(/[0-9]/, {
          message: "Password must contain at least one number.",
        }),
    })
    .strict(),
});

export type CustomerUser = z.infer<typeof createCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
export type LoginCustomer = z.infer<typeof loginCustomerSchema>;
