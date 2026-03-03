import {
  createSupportTicket,
  findTickets,
  findTicketsByCustomer,
  findTicketsById,
  updateTicketStatus,
} from "@/services/support-tickets.service";
import { SupportTicketsQueryOptions } from "@/types/support.tickets";
import AppError from "@/utils/app-error";
import { CreateSupportTicket, UpdateSupportTicket } from "@/validations/ticket";
import { NATIONALITY, TicketStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const fetchTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const q = (req.query.q || "").toString();
  const status = (req.query.status || "").toString() as TicketStatus;
  const nationality = (req.query.nationality || "").toString() as NATIONALITY;
  const dateRange = (req.query.dateRange || "").toString();

  const queryOptions: SupportTicketsQueryOptions = {
    page,
    limit,
    q,
    status,
    nationality,
    dateRange,
  };

  try {
    const supportTickets = await findTickets(queryOptions);
    res.status(StatusCodes.OK).json(supportTickets);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const fetchTicketsByCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const q = (req.query.q || "").toString();
  const status = (req.query.status || "").toString() as TicketStatus;

  const queryOptions: SupportTicketsQueryOptions = {
    page,
    limit,
    q,
    status,
  };
  const id = req.user?.id;
  try {
    const customers = await findTicketsByCustomer(id!, queryOptions);
    res.status(StatusCodes.OK).json(customers);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const fetchTicketsyId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const user = await findTicketsById(id);
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const submitSupportTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.user?.id;
  const { body: data }: CreateSupportTicket = req;

  try {
    const user = await createSupportTicket(data, id!, req.file);

    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};

export const updateSupportTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { body: data }: UpdateSupportTicket = req;

  try {
    const user = await updateTicketStatus(id, data.status);

    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(
      new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
};
