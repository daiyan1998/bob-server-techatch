import { db } from "@/db";
import path from "path";
import AppError from "@/utils/app-error";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { Prisma, Role } from "@prisma/client";

export const findUserByEmail = async (email: string) => {
  return await db.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id: string) => {
  return await db.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      image: true,
      role: true,
    },
  });
};

export const findUserByRefreshToken = async (refreshToken: string) => {
  return await db.user.findUnique({
    where: {
      refreshToken,
    },
  });
};

export const updateUserById = async (
  userId: string,
  data: Prisma.UserUpdateInput,
  imageFile?: Express.Multer.File,
) => {
  if (imageFile) {
    data.image = path.join("/public/tmp", imageFile.filename);
  }

  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error) {
    throw new Error("Error updating user");
  }
};

export const changeUserPassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError("Old password is incorrect", StatusCodes.UNAUTHORIZED);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully." };
};

export const changeUserPasswordByAdmin = async (
  userId: string,
  newPassword: string,
) => {
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully by admin." };
};

export const createAdminUser = async (
  data: any,
  imageFile?: Express.Multer.File,
) => {
  const { password, role, email, phone, ...userData } = data;

  if (imageFile) {
    userData.image = path.join("/public/tmp", imageFile.filename);
  }

  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new Error("User already registered!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await db.user.create({
      data: {
        ...userData,
        email,
        phone,
        role,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return newUser;
  } catch (error) {
    throw new Error("Error creating admin user.");
  }
};

export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
  q: string = "",
) => {
  const skip = (page - 1) * limit;
  try {
    const whereClause: Prisma.UserWhereInput = {
      role: {
        in: [Role.MANAGER, Role.EDITOR],
      },
    };

    if (q) {
      whereClause.OR = [
        {
          firstName: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: q,
            mode: "insensitive",
          },
        },
      ];
    }

    const users = await db.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    const totalAdmins = await db.user.count({
      where: whereClause,
    });

    return {
      totalAdmins,
      totalPages: Math.ceil(totalAdmins / limit),
      currentPage: page,
      users,
    };
  } catch (error) {
    throw new Error("Error fetching users.");
  }
};

export const deleteUserById = async (userId: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    await db.user.delete({
      where: { id: userId },
    });

    return { message: "User deleted successfully." };
  } catch (error) {
    throw new Error("Error deleting user.");
  }
};
