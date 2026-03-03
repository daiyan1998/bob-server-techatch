import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  fetchAllPayments,
  fetchPaymentById,
  fetchPaymentsByCustomerId,
  validateBdPayment,
  validateIndPayment,
} from "@/services/payments.service";
import { BanPayment, IndPayment } from "@/validations/payment";
import AppError from "@/utils/app-error";
import { NATIONALITY, PaymentStatus, Vendor } from "@prisma/client";
import { PaymentsQueryOptions } from "@/types/payments";
import { verifyBkashSignature } from "@/utils/bkash-auth";
export const validateBanClientPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.query.status === "success") {
      const { paymentID } = req.query;

      if (paymentID) {
        if (typeof paymentID === "string") {
          const validationResponse = await validateBdPayment(paymentID);
          if (validationResponse.statusCode === "0000") {
            res.redirect(`${process.env.BKASH_SUCCESS_URL}`);
          } else {
            res.redirect(`${process.env.BKASH_FAIL_URL}`);
          }
        } else {
          throw new Error("Invalid paymentID");
        }
      }
    } else {
      res.redirect(`${process.env.BKASH_FAIL_URL}`);
    }
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const validateIndClientPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {

  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      throw new Error("Invalid Signature");
    }

    const data: IndPayment = req.body;
    const validationResponse = await validateIndPayment(data, `${signature}`);
    res.status(StatusCodes.OK).json(validationResponse);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getCustomerPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { page, pageSize, q, status } = req.query;

    if (!userId) {
      return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    }

    const payments = await fetchPaymentsByCustomerId(
      userId,
      Number(page) || 1,
      Number(pageSize) || 10,
      q as string,
      status as PaymentStatus,
    );

    res.status(StatusCodes.OK).send(payments);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getAllPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const q = (req.query.q || "").toString();
    const status = (req.query.status || "").toString() as PaymentStatus;
    const vendor = (req.query.vendor || "").toString() as Vendor;
    const nationality = (req.query.nationality || "").toString() as NATIONALITY;
    const dateRange = (req.query.dateRange || "").toString();

    const queryOptions: PaymentsQueryOptions = {
      page,
      limit,
      q,
      status,
      vendor,
      nationality,
      dateRange,
    };

    const payments = await fetchAllPayments(queryOptions);

    res.status(StatusCodes.OK).send(payments);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const payment = await fetchPaymentById(id);
    res.status(StatusCodes.OK).send(payment);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: "Internal Server Error",
    });
  }
};
