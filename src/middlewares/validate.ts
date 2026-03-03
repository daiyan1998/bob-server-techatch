import AppError from "@/utils/app-error";
import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

const validate =
  (schema: AnyZodObject) => (req: Request, _: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstErrorMessage =
          error.errors[0]?.message || "Validation error";
        return next(new AppError(firstErrorMessage, 400));
      }
      return next(new AppError("Internal server error", 500));
    }
  };

export default validate;
