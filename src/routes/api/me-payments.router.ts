import { Router } from "express";
import { verifyJWTCustomer } from "@/middlewares/auth";
import {
  getCustomerPayments,
  getPaymentById,
} from "@/controllers/payments.controller";

const router = Router();

router.route("/").get(verifyJWTCustomer, getCustomerPayments);

router.route("/:id").get(verifyJWTCustomer, getPaymentById);

export default router;
