import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";
import {
  fetchTickets,
  fetchTicketsyId,
  submitSupportTicket,
  updateSupportTicket,
} from "@/controllers/support-tickets.controller";
import validate from "@/middlewares/validate";
import { creatTicketSchema, updateTicketSchema } from "@/validations/ticket";
import upload from "@/middlewares/multer";

const router = Router();

router
  .route("/")
  .get(verifyJWT, verifyRoles("ADMIN"), fetchTickets)
  .post(
    verifyJWTCustomer,
    upload.single("attachment"),
    validate(creatTicketSchema),
    submitSupportTicket,
  );
router
  .route("/:id")
  .get(verifyJWT, verifyRoles("ADMIN"), fetchTicketsyId)
  .patch(
    verifyJWT,
    verifyRoles("ADMIN"),
    validate(updateTicketSchema),
    updateSupportTicket,
  );

export default router;
