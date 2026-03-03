import {
  createAdminUser,
  getAllUsers,
  findUserById,
  updateUserById,
  deleteUserById,
  changeUserPasswordByAdmin,
} from "@/services/users.service";
import AppError from "@/utils/app-error";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UpdateUserValues, UserIdParams } from "@/validations/user";

export const fetchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const q = (req.query.q || "").toString();

    const users = await getAllUsers(page, limit, q);
    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const fetchUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const user = await findUserById(userId);
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newUser = await createAdminUser(req.body);
    res.status(StatusCodes.CREATED).json(newUser);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { body: data }: UpdateUserValues = req;
  const { userId } = req.params;
  if (!userId) {
    return next(new AppError("Bad Request", StatusCodes.BAD_REQUEST));
  }

  try {
    const user = await updateUserById(userId, data, req.file);
    res
      .status(StatusCodes.OK)
      .json({ message: "Profile Update successfully." });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
  }

  const { newPassword } = req.body;

  try {
    await changeUserPasswordByAdmin(userId, newPassword);
    res
      .status(StatusCodes.OK)
      .json({ message: "Password updated successfully." });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const removeUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId } = req.params;

  try {
    const result = await deleteUserById(userId);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
