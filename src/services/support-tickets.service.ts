import { db } from "@/db";
import path from "path";
import {
  NotificationRequestType,
  NotificationType,
  Prisma,
  TicketStatus,
} from "@prisma/client";
import { SupportTicketsQueryOptions } from "@/types/support.tickets";
import {
  createAdminNotification,
  createCustomerNotification,
} from "./notifications.service";

import { sendSupportTicketNotification } from "./notification-delivery.service";
import { generateId, parseDateRange } from "@/utils/helper-fns";
import { SysEntities } from "@/utils/constants";

export const createSupportTicket = async (
  data: Prisma.SupportTicketCreateInput,
  userId: string,
  imageFile?: Express.Multer.File,
) => {
  const { title, description } = data;
  const ticketData = { ...data };

  if (imageFile) {
    ticketData.attachment = path.join("/public/tmp", imageFile.filename);
  }

  try {
    const newTicket = await db.supportTicket.create({
      data: {
        id: generateId(SysEntities.SUPPORT_TICKET),
        title,
        description,
        attachment: ticketData.attachment ?? null,
        customer: {
          connect: { id: userId },
        },
      },
    });

    await createAdminNotification(
      `A new support ticket issued`,
      `a support ticket issued; ID: ${newTicket.id}`,
      newTicket.id,
      NotificationType.SUPPORT,
      NotificationRequestType.POSITIVE,
    );

    return newTicket;
  } catch (error) {
    throw new Error("Error creating support ticket.");
  }
};

export const findTickets = async (options: SupportTicketsQueryOptions) => {
  const skip = (options.page - 1) * options.limit;

  try {
    const dateRange = parseDateRange(options.dateRange);

    const whereClause: Prisma.SupportTicketWhereInput = {
      ...(options.q && {
        OR: [
          {
            title: {
              contains: options.q,
              mode: "insensitive",
            },
          },
          {
            id: {
              contains: options.q,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(options.status && {
        status: options.status,
      }),
      ...(options.nationality && {
        customer: {
          nationality: options.nationality,
        },
      }),
      ...(dateRange && {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      }),
    };

    const supportTickets = await db.supportTicket.findMany({
      where: whereClause,
      skip,
      take: options.limit,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            nationality: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalSupportTickets = await db.supportTicket.count({
      where: whereClause,
    });

    return {
      supportTickets,
      totalSupportTickets,
      totalPages: Math.ceil(totalSupportTickets / options.limit),
      currentPage: options.page,
    };
  } catch (error) {
    throw new Error("Error fetching tickets");
  }
};

export const findTicketsById = async (id: string) => {
  return await db.supportTicket.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      attachment: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
    },
  });
};

export const findTicketsByCustomer = async (
  customerId: string,
  options: SupportTicketsQueryOptions,
) => {
  const skip = (options.page - 1) * options.limit;

  try {
    const whereClause: Prisma.SupportTicketWhereInput = {
      customerId,

      ...(options.q && {
        OR: [
          {
            title: {
              contains: options.q,
              mode: "insensitive",
            },
          },
        ],
      }),

      ...(options.status && {
        status: options.status as TicketStatus,
      }),
    };

    const tickets = await db.supportTicket.findMany({
      where: whereClause,
      skip,
      take: options.limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalTickets = await db.supportTicket.count({
      where: whereClause,
    });

    return {
      tickets,
      totalTickets,
      totalPages: Math.ceil(totalTickets / options.limit),
      currentPage: options.page,
    };
  } catch (error) {
    throw new Error("Error fetching tickets for customer");
  }
};

export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus,
) => {
  try {
    const updatedTicket = await db.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      select: {
        id: true,
        status: true,
        customerId: true,
      },
    });

    await createCustomerNotification(
      `Your support ticket has been ${status}`,
      `Ticket ID: ${updatedTicket.id}`,
      updatedTicket.id,
      updatedTicket.customerId!,
      NotificationType.SUPPORT,
      NotificationRequestType.POSITIVE,
    );

    await sendSupportTicketNotification(
      updatedTicket.customerId!,
      updatedTicket.id,
      status,
    );

    return updatedTicket;
  } catch (error) {
    throw new Error("Error updating ticket status");
  }
};
