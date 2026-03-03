import cors from "cors";
import { allowedOrigins } from "../configs/allowed-origins";
import AppError from "@/utils/app-error";
import { ENV } from "@/utils/constants";
import { RequestHandler } from "express";

const isValidOrigin = (origin: string): boolean =>
  allowedOrigins.includes(origin);

export const dynamicCors: RequestHandler = (req, res, next) => {
  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const isDevelopment = process.env.NODE_ENV === ENV.DEV;

      const isWebhookRoute = [
        "/api/v1/payments/validate-ban-payment",
        "/api/v1/payments/validate-ind-payment",
      ].some((path) => req.originalUrl.startsWith(path));

      // Allow requests without Origin if they're from IPNs
      if (!origin) {
        if (isDevelopment || isWebhookRoute) {
          callback(null, true);
          return;
        }
        callback(new AppError("Origin is required", 403));
        return;
      }

      if (isValidOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError("Origin not allowed", 403));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 24 * 60 * 60,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  return cors(corsOptions)(req, res, next);
};