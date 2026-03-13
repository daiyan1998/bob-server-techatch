import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";
import {
  createRequest,
  getAllCustomerRequests,
  getRequest,
  updateRequestByIdController,
  updateRequestItemController,
} from "@/controllers/requests.controller";
import validate from "@/middlewares/validate";
import {
  createRequestSchema,
  updateRequestByAdminSchema,
  updateRequestItemByAdminSchema,
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

// Per-item admin update route
router
  .route("/:requestId/items/:itemId")
  .patch(
    verifyJWT,
    verifyRoles("ADMIN"),
    validate(updateRequestItemByAdminSchema),
    updateRequestItemController,
  );

export default router;
