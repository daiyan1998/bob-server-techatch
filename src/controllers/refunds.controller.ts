import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createRefundRequest,
  getRefundRequestById,
  getRefundRequests,
  getRefundStats,
  processRefundRequest,
} from "@/services/refunds.service";
import AppError from "@/utils/app-error";
import { RefundReason, RefundStatus } from "@prisma/client";

/**
 * Create a new refund request
 */
export const createRefundRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    const { orderId, reason, description, attachments } = req.body;

    const refundRequest = await createRefundRequest({
      orderId,
      customerId,
      reason: reason as RefundReason,
      description,
      attachments: attachments || [],
    });

    res.status(StatusCodes.CREATED).json(refundRequest);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Get all refund requests (admin)
 */
export const getAllRefundRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = req.query.status as RefundStatus | undefined;
    const orderId = req.query.orderId as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const refundRequests = await getRefundRequests(
      {
        status,
        orderId,
        customerId,
      },
      page,
      pageSize,
    );

    res.status(StatusCodes.OK).json(refundRequests);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Get customer's refund requests
 */
export const getCustomerRefundRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const refundRequests = await getRefundRequests(
      { customerId },
      page,
      pageSize,
    );

    res.status(StatusCodes.OK).json(refundRequests);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Get refund request by ID
 */
export const getRefundRequestByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params as { id: string };
    const refundRequest = await getRefundRequestById(id);

    if (!refundRequest) {
      return next(
        new AppError("Refund request not found", StatusCodes.NOT_FOUND),
      );
    }

    // Check if user is admin or the customer who made the request
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && refundRequest.customerId !== req.user?.id) {
      return next(new AppError("Unauthorized", StatusCodes.FORBIDDEN));
    }

    res.status(StatusCodes.OK).json(refundRequest);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Process a refund request (admin only)
 */
export const processRefundRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params as { id: string };
    const adminId = req.user?.id;

    if (!adminId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    const { status, adminNotes, refundMethod, transactionId } = req.body;

    if (status !== RefundStatus.APPROVED && status !== RefundStatus.REJECTED) {
      return next(new AppError("Invalid status", StatusCodes.BAD_REQUEST));
    }

    const updatedRefundRequest = await processRefundRequest(id, adminId, {
      status,
      adminNotes,
      refundMethod,
      transactionId,
    });

    res.status(StatusCodes.OK).json(updatedRefundRequest);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Get refund statistics (admin only)
 */
export const getRefundStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await getRefundStats();
    res.status(StatusCodes.OK).json(stats);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
