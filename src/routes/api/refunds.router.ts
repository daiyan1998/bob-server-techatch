import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";
import validate from "@/middlewares/validate";
import {
  createRefundRequestController,
  getAllRefundRequestsController,
  getCustomerRefundRequestsController,
  getRefundRequestByIdController,
  processRefundRequestController,
  getRefundStatsController
} from "@/controllers/refunds.controller";

import upload from "@/middlewares/multer";
import { createRefundRequestSchema, getRefundRequestsSchema, processRefundRequestSchema } from "@/validations/refund";

const router = Router();


router
  .route("/")
  .post(
    verifyJWTCustomer,
    upload.array("attachments", 5), // Allow up to 5 attachments
    validate(createRefundRequestSchema),
    createRefundRequestController
  );


router
  .route("/")
  .get(
    verifyJWT,
    verifyRoles("ADMIN"),
    validate(getRefundRequestsSchema),
    getAllRefundRequestsController
  );

router
  .route("/stats")
  .get(
    verifyJWT,
    verifyRoles("ADMIN"),
    getRefundStatsController
  );

router
  .route("/:id")
  .get(
    verifyJWT,
    getRefundRequestByIdController
  );

router
  .route("/:id/process")
  .patch(
    verifyJWT,
    verifyRoles("ADMIN"),
    validate(processRefundRequestSchema),
    processRefundRequestController
  );

export default router;