// src/logger/index.ts
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { fileURLToPath } from "url";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";
const bdTimestamp = format((info) => {
  info.timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
  });
  return info;
});
const fileFormat = format.combine(
  bdTimestamp(),
  format.errors({ stack: true }),
  format.json(),
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    new transports.Console({
      format: isDev
        ? format.combine(format.colorize(), format.simple())
        : fileFormat,
    }),

    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs/app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
      level: "info",
    }),

    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs/error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      format: fileFormat,
      level: "error",
    }),
  ],
});

export default logger;
