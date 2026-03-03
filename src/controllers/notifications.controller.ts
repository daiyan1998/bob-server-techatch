import {
  fetchAdminNotification,
  fetchCustomerNotification,
  updateAdminNotification,
  updateCustomerNotification,
} from "@/services/notifications.service";
import AppError from "@/utils/app-error";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const getCustomerNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(
        new AppError("User not authenticated", StatusCodes.UNAUTHORIZED),
      );
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const notifications = await fetchCustomerNotification(
      userId,
      page,
      pageSize,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      ...notifications,
    });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getAdminNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const notifications = await fetchAdminNotification(page, pageSize);

    res.status(StatusCodes.OK).json({
      success: true,
      ...notifications,
    });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const updateNotificationAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await updateAdminNotification(id);
    if (!notification) {
      return next(
        new AppError("notification not found", StatusCodes.NOT_FOUND),
      );
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Notification updated successfully" });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const updateNotificationCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await updateCustomerNotification(id);
    if (!notification) {
      return next(new AppError("Request not found", StatusCodes.NOT_FOUND));
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Notification updated successfully" });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
