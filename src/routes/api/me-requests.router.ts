import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";
import {
  createRequest,
  getCustomerRequests,
  getRequest,
  updateRequestByIdController,
} from "@/controllers/requests.controller";
import validate from "@/middlewares/validate";
import {
  getRequestSchema,
  updateRequestByUserSchema,
} from "@/validations/requests";

const router = Router();

router
  .route("/")
  .get(verifyJWTCustomer, validate(getRequestSchema), getCustomerRequests);

router
  .route("/:id")
  .patch(
    verifyJWTCustomer,
    validate(updateRequestByUserSchema),
    updateRequestByIdController,
  )
  .get(verifyJWTCustomer, validate(getRequestSchema), getRequest);

export default router;
