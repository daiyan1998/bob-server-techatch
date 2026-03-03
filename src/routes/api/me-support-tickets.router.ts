import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";
import {
  fetchTicketsByCustomer,
  fetchTicketsyId,
} from "@/controllers/support-tickets.controller";

const router = Router();

router.route("/").get(verifyJWTCustomer, fetchTicketsByCustomer);
router.route("/:id").get(verifyJWTCustomer, fetchTicketsyId);

export default router;
