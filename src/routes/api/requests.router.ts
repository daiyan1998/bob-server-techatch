import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";
import {
  createRequest,
  getAllCustomerRequests,
  getRequest,
  updateRequestByIdController,
} from "@/controllers/requests.controller";
import validate from "@/middlewares/validate";
import {
  createRequestSchema,
  updateRequestByAdminSchema,
  getRequestSchema,
} from "@/validations/requests";
import upload from "@/middlewares/multer";

const router = Router();

router
  .route("/")
  .get(verifyJWT, validate(getRequestSchema), getAllCustomerRequests)
  .post(
    verifyJWTCustomer,
    upload.single("image"),
    validate(createRequestSchema),
    createRequest,
  );
router
  .route("/:id")
  .get(verifyJWT, getRequest)
  .patch(
    verifyJWT,
    validate(updateRequestByAdminSchema),
    updateRequestByIdController,
  );

export default router;
