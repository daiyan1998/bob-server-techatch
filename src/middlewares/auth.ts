import AppError from "@/utils/app-error";
import { NextFunction, Request, Response } from "express";
import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { db } from "@/db";
import { CustomJwtPayload } from "@/types/auth";

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new AppError("forbidden", StatusCodes.FORBIDDEN));
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
    ) as CustomJwtPayload;

    const userExists = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!userExists) {
      return next(new AppError("forbidden", StatusCodes.FORBIDDEN));
    }

    req.user = {
      id: decoded.userId,
      role: decoded.userRole,
    };

    next();
  } catch (error) {
    console.error(error);
    if (error instanceof TokenExpiredError) {
      return next(new AppError("Token expired", StatusCodes.UNAUTHORIZED));
    }

    if (error instanceof JsonWebTokenError || error instanceof NotBeforeError) {
      return next(new AppError("Invalid token", StatusCodes.FORBIDDEN));
    }
    next(error);
  }
};

export const verifyJWTCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new AppError("forbidden", StatusCodes.FORBIDDEN));
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
    ) as CustomJwtPayload;

    const userExists = await db.customer.findUnique({
      where: { id: decoded.userId },
    });

    if (!userExists) {
      return next(new AppError("forbidden", StatusCodes.FORBIDDEN));
    }

    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    console.error(error);
    if (error instanceof TokenExpiredError) {
      return next(new AppError("Token expired", StatusCodes.UNAUTHORIZED));
    }

    if (error instanceof JsonWebTokenError || error instanceof NotBeforeError) {
      return next(new AppError("Invalid token", StatusCodes.FORBIDDEN));
    }
    next(error);
  }
};

export const verifyRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    if (!req?.user?.role)
      return next(new AppError("permission denied", StatusCodes.UNAUTHORIZED));

    const rolesArr = [...allowedRoles];
    // @ts-ignore
    const result = rolesArr.includes(req.user.role);

    if (!result)
      return next(new AppError("permission denied", StatusCodes.UNAUTHORIZED));

    next();
  };
};
