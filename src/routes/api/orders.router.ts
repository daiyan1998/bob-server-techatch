import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";

import validate from "@/middlewares/validate";

import {
  createCustomerOrder,
  findOrder,
  findOrderDetailsController,
  makePayment,
  updateOrder,
} from "@/controllers/orders.controller";
import {
  createOrderSchema,
  getOrderSchema,
  updateOrderSchema,
} from "@/validations/order";

const router = Router();

router
  .route("/")
  .get(verifyJWT, validate(getOrderSchema), findOrder)
  .post(verifyJWTCustomer, validate(createOrderSchema), createCustomerOrder);
router
  .route("/:id")
  .get(verifyJWT, validate(getOrderSchema), findOrderDetailsController)
  .patch(
    verifyJWT,
    verifyRoles("ADMIN"),
    validate(updateOrderSchema),
    updateOrder,
  );

router.route("/:id/initiate-payment").get(verifyJWTCustomer, makePayment);

export default router;
