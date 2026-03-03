import { Router } from "express";
import { verifyJWTCustomer } from "@/middlewares/auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/controllers/customers.controller";
import validate from "@/middlewares/validate";
import { updateCustomerSchema } from "@/validations/customer";
import upload from "@/middlewares/multer";

const router = Router();

router
  .route("/")
  .get(verifyJWTCustomer, getCustomerProfile)
  .patch(
    verifyJWTCustomer,
    upload.single("image"),
    validate(updateCustomerSchema),
    updateCustomerProfile,
  );

export default router;
