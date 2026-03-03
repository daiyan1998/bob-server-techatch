import { Request, Response, NextFunction } from "express";
import { createLogger } from "@/utils/log-events";

export interface CustomError extends Error {
  statusCode?: number;
  success?: boolean;
}

const errorLogger = createLogger({
  logName: "error-log.txt",
});

const errorHandler = async (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const statusCode = error.statusCode || 500;
    const success = error.success || false;
    const message = error.message || "Internal Server Error";

    await errorLogger.logEvent(`${error.name || "Error"}: ${message}`);

    res.status(statusCode).json({
      success,
      message,
    });
  } catch (loggingError) {
    console.error("Error in error handler:", loggingError);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export default errorHandler;
