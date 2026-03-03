import {
  findUserById,
  updateUserById,
  changeUserPassword,
} from "@/services/users.service";
import AppError from "@/utils/app-error";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.user?.id;

  if (!id) {
    return next(new AppError("unauthorized", StatusCodes.UNAUTHORIZED));
  }
  try {
    const user = await findUserById(id);

    if (!user) {
      return next(new AppError("unauthorized", StatusCodes.UNAUTHORIZED));
    }

    res.status(StatusCodes.OK).send(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.user?.id;
  if (!id) {
    return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
  }

  try {
    const user = await updateUserById(id, req.body, req.file);
    res.status(StatusCodes.OK).send(user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) {
    return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
  }

  const { oldPassword, newPassword } = req.body;

  try {
    await changeUserPassword(userId, oldPassword, newPassword);
    res
      .status(StatusCodes.OK)
      .json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};
