import { db } from "@/db";
import bcrypt from "bcryptjs";
import { CookieOptions, Response } from "express";
import { sendOtp } from "../configs/sms/bulk-sms";
import { sendWhatsAppOtp } from "../configs/sms/ai-sensy-sms";
import { generateOTP } from "../utils/otp-generator";
import { CustomerUser } from "@/validations/customer";
import AppError from "@/utils/app-error";
import { StatusCodes } from "http-status-codes";
import { OTP_EXPIRATION_MINUTES } from "@/utils/constants";
import { Customer, NATIONALITY } from "@prisma/client";
import crypto from "crypto";
import { sendEmailOtpNotification, sendOtpNotification } from "./notification-delivery.service";
import jwt from "jsonwebtoken";

export const isPasswordMatched = async (
  password: string,
  userPassword: string,
) => {
  return await bcrypt.compare(password, userPassword);
};

export const clearAuthCookies = (res: Response) => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  res.clearCookie("jwt", cookieOptions);
};

export const updateRefreshToken = async (
  refreshToken: string | null,
  userId: string,
) => {
  return await db.user.update({
    where: {
      id: userId,
    },
    data: {
      refreshToken,
    },
  });
};

export const updateRefreshTokenCustomer = async (
  refreshToken: string | null,
  userId: string,
) => {
  return await db.customer.update({
    where: {
      id: userId,
    },
    data: {
      refreshToken,
    },
  });
};

export const registerCustomer = async (data: CustomerUser["body"]) => {
  const existingCustomer = await db.customer.findFirst({
    where: {
      OR: [{ email: data.email }],
    },
  });
  if (existingCustomer) {
    throw new AppError(
      "A customer with that email or phone already exists.",
      StatusCodes.BAD_REQUEST,
    );
  }

  // if (
  //   data.nationality === NATIONALITY.BANGLADESH &&
  //   !data.phone.startsWith("+880")
  // ) {
  //   throw new AppError(
  //     "Invalid phone number format for Bangladesh",
  //     StatusCodes.BAD_REQUEST,
  //   );
  // }

  // if (data.nationality === NATIONALITY.INDIA && !data.phone.startsWith("+91")) {
  //   throw new AppError(
  //     "Invalid phone number format for India",
  //     StatusCodes.BAD_REQUEST,
  //   );
  // }

  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRATION_MINUTES);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const customer = await db.customer.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      // phone: data.phone,
      nationality: data.nationality,
      password: hashedPassword,
      isVerified: false,
      address: {
        create: {
          street: "",
          postalCode: "",
          mapLink: "",
        },
      },
    },
  });

  await sendEmailOtpNotification(customer.id, otp);

  const hashedOtp = await bcrypt.hash(otp, 10);

  await db.otp.upsert({
    where: { customerId: customer.id },
    update: { otp: hashedOtp, expiresAt },
    create: {
      customerId: customer.id,
      otp: hashedOtp,
      expiresAt,
    },
  });

  return {
    success: true,
    message: "Customer registered successfully. Please verify your account.",
  };
};

export const verifyOTP = async (
  phone: string,
  submittedOTP: string,
): Promise<{ success?: boolean; message: string }> => {
  try {
    const customer = await db.customer.findUnique({
      where: { phone },
      include: { otp: true },
    });

    if (!customer) {
      return { message: "Customer not found. Please register." };
    }

    if (customer.isVerified) {
      return { success: true, message: "Already Verified" };
    }

    if (!customer.otp) {
      return { message: "No OTP record found. Please register again." };
    }

    if (new Date() > customer.otp.expiresAt) {
      return { message: "OTP expired. Please request a new one." };
    }

    const isOtpValid = await bcrypt.compare(submittedOTP, customer.otp.otp);
    if (!isOtpValid) {
      return { message: "Invalid OTP provided." };
    }

    await db.customer.update({
      where: { phone },
      data: { isVerified: true },
    });

    return { success: true, message: "Customer verified successfully." };
  } catch (error) {
    return { message: "An unexpected error occurred." };
  }
};

export const verifyEmailOTP = async (
  email: string,
  submittedOTP: string,
): Promise<{ success?: boolean; message: string }> => {
  try {
    const customer = await db.customer.findUnique({
      where: { email },
      include: { otp: true },
    });

    if (!customer) {
      return { message: "Customer not found. Please register." };
    }

    if (customer.isVerified) {
      return { success: true, message: "Already Verified" };
    }

    if (!customer.otp) {
      return { message: "No OTP record found. Please register again." };
    }

    if (new Date() > customer.otp.expiresAt) {
      return { message: "OTP expired. Please request a new one." };
    }

    const isOtpValid = await bcrypt.compare(submittedOTP, customer.otp.otp);
    if (!isOtpValid) {
      return { message: "Invalid OTP provided." };
    }

    await db.customer.update({
      where: { email },
      data: { isVerified: true },
    });

    return { success: true, message: "Customer verified successfully." };
  } catch (error) {
    return { message: "An unexpected error occurred." };
  }
};

export const resendOTP = async (
  phone: string,
): Promise<{ message: string }> => {
  try {
    const customer = await db.customer.findUnique({
      where: { phone },
      include: { otp: true },
    });

    if (!customer) {
      return { message: "Customer not found. Please register." };
    }

    if (!customer.otp) {
      return {
        message: "No registration session found. Please register again.",
      };
    }

    const newOtp = generateOTP();
    const newExpiresAt = new Date();
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + OTP_EXPIRATION_MINUTES);

    const hashedOtp = await bcrypt.hash(newOtp, 10);

    await db.otp.update({
      where: { customerId: customer.id },
      data: {
        otp: hashedOtp,
        expiresAt: newExpiresAt,
      },
    });

    if (customer.phone) {
      if (customer.nationality === NATIONALITY.BANGLADESH) {
        await sendOtp(customer.phone, newOtp);
      } else {
        await sendWhatsAppOtp(
          customer.phone,
          newOtp,
          `${customer.firstName} ${customer.lastName}`,
        );
      }
    } else {
      throw new AppError("Customer phone not found.", StatusCodes.BAD_REQUEST);
    }

    return { message: "A new OTP has been sent via phone." };
  } catch (error) {
    throw error;
  }
};

export const sendPhoneOTP = async (phone: string) => {
  const customer = await db.customer.findUnique({
    where: { phone },
    include: { otp: true },
  });

  if (!customer) {
    throw new AppError(
      "No account found with that phone number",
      StatusCodes.NOT_FOUND,
    );
  }

  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRATION_MINUTES);

  const hashedOtp = await bcrypt.hash(otp, 10);

  await db.otp.upsert({
    where: { customerId: customer.id },
    update: { otp: hashedOtp, expiresAt },
    create: {
      customerId: customer.id,
      otp: hashedOtp,
      expiresAt,
    },
  });

  if (customer.phone) {
    if (customer.nationality === NATIONALITY.BANGLADESH) {
      await sendOtp(customer.phone, otp);
    }
  } else {
    throw new AppError("Customer phone not found.", StatusCodes.BAD_REQUEST);
  }

  return {
    success: true,
    message: "Phone OTP sent successfully.",
  };
};

export const sendEmailOTP = async (email: string) => {
  const customer = await db.customer.findUnique({
    where: { email },
    include: { otp: true },
  });

  if (!customer) {
    throw new AppError(
      "No account found with that email address",
      StatusCodes.NOT_FOUND,
    );
  }

  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRATION_MINUTES);

  const hashedOtp = await bcrypt.hash(otp, 10);

  await db.otp.upsert({
    where: { customerId: customer.id },
    update: { otp: hashedOtp, expiresAt },
    create: {
      customerId: customer.id,
      otp: hashedOtp,
      expiresAt,
    },
  });

  if (!customer.email) {
    throw new AppError("Customer email not found.", StatusCodes.BAD_REQUEST);
  }

  await sendEmailOtpNotification(customer.id, otp);

  return {
    success: true,
    message: "Email OTP sent successfully.",
  };
};

export const requestPasswordReset = async (phone: string) => {
  const customer = await db.customer.findUnique({
    where: { phone },
  });

  if (!customer) {
    throw new AppError(
      "No account found with that phone number",
      StatusCodes.NOT_FOUND,
    );
  }

  const otp = generateOTP();
  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRATION_MINUTES);

  const hashedOtp = await bcrypt.hash(otp, 10);

  await db.otp.upsert({
    where: { customerId: customer.id },
    update: {
      otp: hashedOtp,
      expiresAt,
      resetToken,
    },
    create: {
      customerId: customer.id,
      otp: hashedOtp,
      expiresAt,
      resetToken,
    },
  });

  if (!customer.phone) {
    throw new AppError("Customer phone not found.", StatusCodes.BAD_REQUEST);
  }

  if (customer.nationality === NATIONALITY.BANGLADESH) {
    await sendOtp(customer.phone, otp);
  } else {
    await sendWhatsAppOtp(
      customer.phone,
      otp,
      `${customer.firstName} ${customer.lastName}`,
    );
  }

  return {
    message: "Password reset OTP sent to your phone",
    resetToken,
  };
};

export const verifyResetOTP = async (
  phone: string,
  submittedOTP: string,
  resetToken: string,
): Promise<{ success?: boolean; message: string; resetToken?: string }> => {
  try {
    const customer = await db.customer.findUnique({
      where: { phone },
      include: { otp: true },
    });

    if (!customer) {
      return { message: "Customer not found" };
    }

    if (!customer.otp) {
      return { message: "No OTP record found. Please request a new one." };
    }

    if (customer.otp.resetToken !== resetToken) {
      return { message: "Invalid reset session" };
    }

    if (new Date() > customer.otp.expiresAt) {
      return { message: "OTP expired. Please request a new one." };
    }

    const isOtpValid = await bcrypt.compare(submittedOTP, customer.otp.otp);
    if (!isOtpValid) {
      return { message: "Invalid OTP provided." };
    }

    return {
      success: true,
      message: "OTP verified successfully",
      resetToken: customer.otp.resetToken,
    };
  } catch (error) {
    return { message: "An unexpected error occurred." };
  }
};

export const resetPassword = async (
  phone: string,
  resetToken: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> => {
  const customer = await db.customer.findUnique({
    where: { phone },
    include: { otp: true },
  });

  if (!customer) {
    throw new AppError("Customer not found", StatusCodes.NOT_FOUND);
  }

  if (!customer.otp || customer.otp.resetToken !== resetToken) {
    throw new AppError(
      "Invalid or expired reset token",
      StatusCodes.BAD_REQUEST,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.customer.update({
    where: { id: customer.id },
    data: { password: hashedPassword },
  });

  // Clear the OTP and reset token
  await db.otp.update({
    where: { customerId: customer.id },
    data: { resetToken: null },
  });

  return { success: true, message: "Password has been reset successfully" };
};

export const loginClientService = async (email: string) => {
  const customer = await db.customer.findUnique({
    where: { email },

    select: {
      firstName: true,
      lastName: true,
      // phone: true,
      email: true,
      id: true,
    },
  });

  if (!customer) {
    throw new AppError("User does not exist", StatusCodes.NOT_FOUND);
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

  return {
    customer,
    accessToken,
    refreshToken,
  };
};

export const generateAccessToken = async (customerId: string) => {
  return jwt.sign(
    {
      userId: customerId,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "1d" },
  );
};
