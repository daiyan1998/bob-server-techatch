import { CookieOptions } from "express";

export const PORT = process.env.PORT || 5000;
export enum ENV {
  DEV = "development",
  PROD = "production",
}
export const OTP_EXPIRATION_MINUTES = 2;
export const OTP_LENGTH = 6;
export const PASSWORD_LENGTH = 8;
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
  secure: true,
  sameSite: "none",
};

export enum SysEntities {
  ORDER = "ORDER",
  PRODUCT_REQUEST = "PRODUCT_REQUEST",
  PAYMENT = "PAYMENT",
  SUPPORT_TICKET = "SUPPORT_TICKET",
}
