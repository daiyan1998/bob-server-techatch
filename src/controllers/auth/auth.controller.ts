import { NextFunction, Request, Response } from "express";
import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import AppError from "@/utils/app-error";
import { cookieOptions } from "@/utils/constants";
import { LoginUser } from "@/validations/user";
import { CustomerUser, LoginCustomer } from "@/validations/customer";

import {
  clearAuthCookies,
  generateAccessToken,
  isPasswordMatched,
  loginClientService,
  sendEmailOTP,
  updateRefreshToken,
  updateRefreshTokenCustomer,
  verifyEmailOTP,
} from "@/services/auth.service";
import {
  findUserByEmail,
  findUserByRefreshToken,
} from "@/services/users.service";
import { CustomJwtPayload } from "@/types/auth";
import {
  registerCustomer,
  verifyOTP,
  resendOTP,
  requestPasswordReset,
  verifyResetOTP,
  resetPassword,
} from "../../services/auth.service";
import {
  findCustomerByEmail,
  findCustomerByPhone,
  findCustomerByRefreshToken,
} from "@/services/customers.service";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const accessToken = await generateAccessToken(user.id);
    console.log("token: ", accessToken);

    // redirect to frontend with the accessToken as query param
    const redirectUrl = `${process.env.FE_BASE_URL}?accessToken=${accessToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("google login controller error: ", error);
    res
      .status(500)
      .json({ message: "An error occurred during authentication", error });
  }
};
// ADMIN Panel login

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body: data }: LoginUser = req;

    const user = await findUserByEmail(data.email);

    if (!user) {
      return next(new AppError("user does not exist", StatusCodes.NOT_FOUND));
    }

    const isMatched = await isPasswordMatched(data.password, user.password);

    if (!isMatched) {
      return next(new AppError("wrong password", StatusCodes.UNAUTHORIZED));
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        userRole: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "1d" },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" },
    );

    await updateRefreshToken(refreshToken, user.id);

    res
      .status(StatusCodes.OK)
      .cookie("jwt", refreshToken, cookieOptions)
      .json({
        success: true,
        message: `Welcome ${user.firstName} ${user.lastName}`,
        accessToken,
      });
  } catch (error) {
    console.error("login controller error: ", error);
    next(error);
  }
};

// ADMIN Panel logout

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    res.status(StatusCodes.NO_CONTENT).end();
    return;
  }

  const refreshToken = cookies.jwt;

  try {
    const user = await findUserByRefreshToken(refreshToken);

    if (!user) {
      clearAuthCookies(res);
      res.status(StatusCodes.NO_CONTENT).end();
      return;
    }

    await updateRefreshToken(null, user.id);

    clearAuthCookies(res);

    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    console.error("logout controller error: ", error);
    next(error);
  }
};

// ADMIN Panel token refresh

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookies = req.cookies;
  if (!cookies.jwt) {
    return next(new AppError("no refresh token found", StatusCodes.NOT_FOUND));
  }
  const refreshToken = cookies.jwt;
  try {
    const user = await findUserByRefreshToken(refreshToken);

    if (!user) {
      clearAuthCookies(res);
      return next(new AppError("invalid token", StatusCodes.FORBIDDEN));
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as CustomJwtPayload;

    if (user.id !== decoded.userId) {
      clearAuthCookies(res);
      return next(new AppError("Token mismatch", StatusCodes.FORBIDDEN));
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        userRole: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "1d" },
    );

    res.status(StatusCodes.OK).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    console.error("refresh token error:", error);

    if (error instanceof TokenExpiredError) {
      clearAuthCookies(res);
      return next(new AppError("Token expired", StatusCodes.UNAUTHORIZED));
    }

    if (error instanceof JsonWebTokenError || error instanceof NotBeforeError) {
      clearAuthCookies(res);
      return next(new AppError("Invalid token", StatusCodes.FORBIDDEN));
    }
    next(error);
  }
};

// Customer panel Register

export const registerClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body: data }: CustomerUser = req;
    const result = await registerCustomer(data);
    if (result.success) {
      const loginResult = await loginClientService(data.email);
      res
        .status(StatusCodes.OK)
        .cookie("jwt", loginResult.refreshToken, cookieOptions)
        .json({
          success: true,
          message: `Welcome ${loginResult.customer.firstName} ${loginResult.customer.lastName}`,
          accessToken: loginResult.accessToken,
          data: loginResult.customer,
        });
    }
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// Customer panel Login

export const loginClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body: data }: LoginCustomer = req;

    const customer = await findCustomerByEmail(data.email);
    


    if (!customer) {
      return next(new AppError("user does not exist", StatusCodes.NOT_FOUND));
    }

    if(customer.accounts.length > 0 && !customer.password) {
      return next(new AppError("This account was created using Google sign-in. Please continue with Google or set a password.", StatusCodes.CONFLICT));
    }

    if (!customer.password) {
      return next(
        new AppError("user does not have a password", StatusCodes.CONFLICT),
      );
    }

    const isMatched = await isPasswordMatched(data.password, customer.password);

    if (!isMatched) {
      return next(new AppError("wrong password", StatusCodes.UNAUTHORIZED));
    }

    const accessToken = jwt.sign(
      {
        userId: customer.id,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "1d" },
    );

    const refreshToken = jwt.sign(
      {
        userId: customer.id,
      },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" },
    );

    await updateRefreshTokenCustomer(refreshToken, customer.id);

    res
      .status(StatusCodes.OK)
      .cookie("jwt", refreshToken, cookieOptions)
      .json({
        success: true,
        message: `Welcome ${customer.firstName} ${customer.lastName}`,
        accessToken,
      });
  } catch (error) {
    console.error("login controller error: ", error);
    next(error);
  }
};

// Customer panel verify client with OTP

export const verifyClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyEmailOTP(email, otp);
    if (!result.success) {
      res.status(400).json(result);
    } else {
      res.status(StatusCodes.ACCEPTED).json(result);
    }
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    next(new AppError(errMessage, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// Customer panel Resend OTP

export const resendOtpClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    const result = await sendEmailOTP(email);
    res.status(StatusCodes.ACCEPTED).json(result);
  } catch (error) {
    next(error);
  }
};

// Customer panel Logout

export const logoutClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    res.status(StatusCodes.NO_CONTENT).end();
    return;
  }

  const refreshToken = cookies.jwt;

  try {
    const customer = await findCustomerByRefreshToken(refreshToken);

    if (!customer) {
      clearAuthCookies(res);
      res.status(StatusCodes.NO_CONTENT).end();
      return;
    }

    await updateRefreshTokenCustomer(null, customer.id);

    clearAuthCookies(res);

    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

// Customer panel token refresh

export const refreshTokenClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookies = req.cookies;
  if (!cookies.jwt) {
    return next(new AppError("no refresh token found", StatusCodes.NOT_FOUND));
  }
  const refreshToken = cookies.jwt;
  try {
    const customer = await findCustomerByRefreshToken(refreshToken);

    if (!customer) {
      clearAuthCookies(res);
      return next(new AppError("invalid token", StatusCodes.FORBIDDEN));
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as CustomJwtPayload;

    if (customer.id !== decoded.userId) {
      clearAuthCookies(res);
      return next(new AppError("Token mismatch", StatusCodes.FORBIDDEN));
    }

    const accessToken = jwt.sign(
      {
        userId: customer.id,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "1d" },
    );

    res.status(StatusCodes.OK).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    console.error("refresh token error:", error);

    if (error instanceof TokenExpiredError) {
      clearAuthCookies(res);
      return next(new AppError("Token expired", StatusCodes.UNAUTHORIZED));
    }

    if (error instanceof JsonWebTokenError || error instanceof NotBeforeError) {
      clearAuthCookies(res);
      return next(new AppError("Invalid token", StatusCodes.FORBIDDEN));
    }
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phone } = req.body;
    const result = await requestPasswordReset(phone);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyResetOtpCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phone, otp, resetToken } = req.body;
    const result = await verifyResetOTP(phone, otp, resetToken);

    if (result.success === false || result.success === undefined) {
      res.status(StatusCodes.BAD_REQUEST).json(result);
    } else {
      res.status(StatusCodes.OK).json(result);
    }
  } catch (error) {
    next(error);
  }
};

export const resetPasswordCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phone, resetToken, password } = req.body;
    const result = await resetPassword(phone, resetToken, password);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};
