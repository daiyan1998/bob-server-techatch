import {
  createOrder,
  getOrderDetails,
  getOrders,
  getOrdersByCustomerId,
  initiatePayment,
  updatOrderById,
} from "@/services/orders.service";
import { OrdersQueryOptions } from "@/types/orders";
import AppError from "@/utils/app-error";
import { CreateOrder } from "@/validations/order";
import { NATIONALITY, OrderStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const createCustomerOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { body: data }: CreateOrder = req;

    if (!userId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }
    const newRequest = await createOrder(userId, data);
    res.status(StatusCodes.CREATED).json(newRequest);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const makePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }
    const newRequest = await initiatePayment(id, userId);
    res.status(StatusCodes.CREATED).json(newRequest);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getCustomerOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, pageSize, q, status, dateRange } = req.query;
  const id = req.user?.id;

  if (!id) {
    return next(new AppError("unauthorized", StatusCodes.UNAUTHORIZED));
  }
  try {
    const user = await getOrdersByCustomerId(
      id,
      Number(page) || 1,
      Number(pageSize) || 10,
      q as string,
      status as OrderStatus,
      dateRange as string,
    );

    if (!user) {
      return next(new AppError("unauthorized", StatusCodes.UNAUTHORIZED));
    }

    res.status(StatusCodes.OK).send(user);
  } catch (error) {
    next(error);
  }
};

export const findOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const q = (req.query.q || "").toString();
  const status = (req.query.status || "").toString() as OrderStatus;
  const dateRange = (req.query.dateRange || "").toString();
  const nationality = (req.query.nationality || "").toString() as NATIONALITY;

  const queryOptions: OrdersQueryOptions = {
    page,
    limit,
    q,
    status,
    nationality,
    dateRange,
  };

  try {
    const orders = await getOrders(queryOptions);

    res.status(StatusCodes.OK).json(orders);
  } catch (error) {
    next(error);
  }
};

export const findOrderDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  try {
    const order = await getOrderDetails(id);

    if (!order) {
      return next(new AppError("unauthorized", StatusCodes.UNAUTHORIZED));
    }

    res.status(StatusCodes.OK).send(order);
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedBy = req.user?.id;

    const updatedRequest = await updatOrderById(id, updatedData, updatedBy!);

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
