import { Request, Response, Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshToken,
  registerClient,
  verifyClient,
  resendOtpClient,
  loginClient,
  refreshTokenClient,
  logoutClient,
  resetPasswordCustomer,
  verifyResetOtpCustomer,
  forgotPassword,
} from "@/controllers/auth/auth.controller";
import validate from "@/middlewares/validate";
import { loginUserSchema } from "@/validations/user";
import {
  createCustomerSchema,
  forgotPasswordSchema,
  loginCustomerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  verifyResetOtpSchema,
} from "@/validations/customer";

const router = Router();

// Google auth
router.report("");

// ADMIN Panel

router.route("/login").post(validate(loginUserSchema), loginUser);
router.route("/logout").post(logoutUser);
router.route("/refresh").get(refreshToken);

// Customer Panel

router
  .route("/customer/register")
  .post(validate(createCustomerSchema), registerClient);
router
  .route("/customer/login")
  .post(validate(loginCustomerSchema), loginClient);
router
  .route("/customer/verify-otp")
  .post(validate(verifyOtpSchema), verifyClient);
router.route("/customer/resend-otp").post(resendOtpClient);

router.route("/customer/logout").post(logoutClient);
router.route("/customer/refresh").get(refreshTokenClient);

router
  .route("/customer/forgot-password")
  .post(validate(forgotPasswordSchema), forgotPassword);
router
  .route("/customer/verify-reset-otp")
  .post(validate(verifyResetOtpSchema), verifyResetOtpCustomer);
router
  .route("/customer/reset-password")
  .post(validate(resetPasswordSchema), resetPasswordCustomer);
export default router;
