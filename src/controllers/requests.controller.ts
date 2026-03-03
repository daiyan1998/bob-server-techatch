import { updateRequestById } from "@/services/requests.service";
import {
  getRequestsByCustomerId,
  getAllRequests,
  getRequestById,
  createProductRequest,
} from "@/services/requests.service";
import { RequestsQueryOptions } from "@/types/requests";
import AppError from "@/utils/app-error";
import { CreateRequest } from "@/validations/requests";
import { NATIONALITY, RequestStatus, RequestType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const createRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }
    const { body: data }: CreateRequest = req;
    const newRequest = await createProductRequest(data, userId, req.file);
    res.status(StatusCodes.CREATED).json(newRequest);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getCustomerRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { page, pageSize, q, status, type, dateRange } = req.query;

    if (!userId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    const statuses = Array.isArray(status)
      ? (status as RequestStatus[])
      : status
        ? [status as RequestStatus]
        : undefined;

    const requests = await getRequestsByCustomerId(
      userId,
      Number(page) || 1,
      Number(pageSize) || 10,
      q as string,
      statuses,
      type as RequestType,
      dateRange as string,
    );

    res.status(StatusCodes.OK).json(requests);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getAllCustomerRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const q = (req.query.q || "").toString();
    const status = (req.query.status || "").toString() as RequestStatus;
    const type = (req.query.type || "").toString() as RequestType;
    const dateRange = (req.query.dateRange || "").toString();
    const nationality = (req.query.nationality || "").toString() as NATIONALITY;

    const queryOptions: RequestsQueryOptions = {
      page,
      limit,
      q,
      status,
      type,
      dateRange,
      nationality,
    };

    const requests = await getAllRequests(queryOptions);

    res.status(StatusCodes.OK).json(requests);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const request = await getRequestById(id);

    if (!request) {
      return next(new AppError("Request not found", StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json(request);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const updateRequestByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updatedData = req.body;
    const updatedRequest = await updateRequestById(id, updatedData, userId);

    if (!updatedRequest) {
      return next(new AppError("Request not found", StatusCodes.NOT_FOUND));
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Request updated successfully." });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
