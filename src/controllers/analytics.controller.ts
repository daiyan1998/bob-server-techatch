import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { fetchAnalytics } from "@/services/analytics.service";

export const getAnalytics = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const analytics = await fetchAnalytics();

    res.status(StatusCodes.OK).json(analytics);
  } catch (error) {
    console.error("analytics controller error: ", error);
    next(error);
  }
};
