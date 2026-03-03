import { db } from "@/db";
import path from "path";
import bcrypt from "bcryptjs";
import { UpdateCustomer } from "@/validations/customer";
import { NATIONALITY, Prisma } from "@prisma/client";
import { CustomersQueryOptions } from "@/types/customers";
import { sendPhoneOTP } from "./auth.service";
export const findCustomerByPhone = async (phone: string) => {
  return await db.customer.findUnique({
    where: { phone },
  });
};

export const findCustomerByEmail = async (email: string) => {
  return await db.customer.findUnique({
    where: { email },
    include: {
      accounts: true,
    },
  });
};

export const findCustomerById = async (id: string) => {
  return await db.customer.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      bio: true,
      nationality: true,
      image: true,
      isVerified: true,
      createdAt: true,
      address: {
        select: {
          house: true,
          road: true,
          street: true,
          thana: true,
          district: true,
          postalCode: true,
          mapLink: true,
        },
      },
    },
  });
};

export const findCustomers = async (options: CustomersQueryOptions) => {
  const skip = (options.page - 1) * options.limit;

  try {
    const whereClause: Prisma.CustomerWhereInput = {
      ...(options.q && {
        OR: [
          {
            firstName: {
              contains: options.q,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: options.q,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: options.q,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: options.q,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(options.verified !== undefined && {
        isVerified: options.verified,
      }),
      ...(options.nationality && {
        nationality: options.nationality as NATIONALITY,
      }),
    };
    const customers = await db.customer.findMany({
      where: whereClause,
      skip,
      take: options.limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isVerified: true,
        nationality: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalCustomers = await db.customer.count({
      where: whereClause,
    });

    return {
      customers,
      totalCustomers,
      totalPages: Math.ceil(totalCustomers / options.limit),
      currentPage: options.page,
    };
  } catch (error) {
    throw new Error("Error fetching customers");
  }
};

export const findCustomerByRefreshToken = async (refreshToken: string) => {
  return await db.customer.findUnique({
    where: {
      refreshToken,
    },
  });
};

export const updateCustomerById = async (
  customerId: string,
  data: UpdateCustomer["body"],
  imageFile?: Express.Multer.File,
) => {
  const updateData: Prisma.CustomerUpdateInput = {
    ...(data.firstName && { firstName: data.firstName }),
    ...(data.lastName && { lastName: data.lastName }),
    ...(data.email && { email: data.email }),
    ...(data.phone && { phone: data.phone }),
    ...(data.nationality && { nationality: data.nationality }),
    ...(data.bio && { bio: data.bio }),
  };

  if (data.address) {
    updateData.address = {
      update: {
        ...(data.address.house && { house: data.address.house }),
        ...(data.address.road && { road: data.address.road }),
        ...(data.address.street && { street: data.address.street }),
        ...(data.address.thana && { thana: data.address.thana }),
        ...(data.address.district && { district: data.address.district }),
        ...(data.address.postalCode && { postalCode: data.address.postalCode }),
        ...(data.address.mapLink && { mapLink: data.address.mapLink }),
      },
    };
  }

  if (imageFile) {
    updateData.image = path.posix.join("/public/tmp", imageFile.filename);
  }

  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    updateData.password = hashedPassword;
  }

  try {
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: updateData,
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bio: true,
        image: true,
        isVerified: true,
        nationality: true,
        isPhoneVerified: true,
        address: {
          select: {
            house: true,
            road: true,
            street: true,
            thana: true,
            district: true,
            postalCode: true,
            mapLink: true,
          },
        },
      },
    });

    if (data.phone && !updatedCustomer.isPhoneVerified) {
      switch (updatedCustomer.nationality) {
        case NATIONALITY.BANGLADESH:
          sendPhoneOTP(data.phone);
          break;
        case NATIONALITY.INDIA:
          await db.customer.update({
            where: { id: customerId },
            data: { isPhoneVerified: true },
          });
          break;
      }
    }

    return updatedCustomer;
  } catch (error) {
    throw new Error("Error updating customer");
  }
};
