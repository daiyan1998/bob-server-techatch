import { Router } from "express";
import { verifyJWTCustomer } from "@/middlewares/auth";
import validate from "@/middlewares/validate";
import {
  getCustomerOrder,
  findOrderDetailsController,
} from "@/controllers/orders.controller";
import { getOrderSchema } from "@/validations/order";

const router = Router();

router
  .route("/")
  .get(verifyJWTCustomer, validate(getOrderSchema), getCustomerOrder);

router
  .route("/:id")
  .get(verifyJWTCustomer, validate(getOrderSchema), findOrderDetailsController);
export default router;
