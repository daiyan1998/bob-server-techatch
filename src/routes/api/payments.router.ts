import {
  getAllPayments,
  getPaymentById,
  validateBanClientPayment,
  validateIndClientPayment,
} from "@/controllers/payments.controller";
import { verifyJWT } from "@/middlewares/auth";
import { Router } from "express";

const router = Router();

router.route("/validate-ban-payment").get(validateBanClientPayment);

router
  .route("/validate-ind-payment")
  .post(validateIndClientPayment);

router.route("/").get(verifyJWT, getAllPayments);

router.route("/:id").get(verifyJWT, getPaymentById);

export default router;
