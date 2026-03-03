import {
  findCustomerById,
  findCustomers,
  updateCustomerById,
} from "@/services/customers.service";
import { CustomersQueryOptions } from "@/types/customers";
import AppError from "@/utils/app-error";
import { UpdateCustomer } from "@/validations/customer";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const getCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.user?.id;
  try {
    if (!id) {
      return next(new AppError("unauthorized", StatusCodes.UNAUTHORIZED));
    }
    const user = await findCustomerById(id);
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const fetchCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const q = (req.query.q || "").toString();
  const nationality = (req.query.nationality || "").toString();
  const verified =
    req.query?.verified !== undefined
      ? req.query.verified === "true"
      : undefined;

  const queryOptions: CustomersQueryOptions = {
    page,
    limit,
    q,
    nationality,
    verified,
  };

  try {
    const customers = await findCustomers(queryOptions);
    res.status(StatusCodes.OK).json(customers);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const fetchCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const user = await findCustomerById(id);
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const updateCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { body: data }: UpdateCustomer = req;
  const id = req.user?.id;
  if (!id) {
    return next(new AppError("Bad Request", StatusCodes.BAD_REQUEST));
  }

  try {
    const customer = await updateCustomerById(id, data, req.file);
    res.status(StatusCodes.OK).json({ success: true, message: customer });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
