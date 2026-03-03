import { Router } from "express";
import { verifyJWT, verifyRoles } from "@/middlewares/auth";
import {
  fetchCustomerById,
  fetchCustomers,
  getCustomerProfile,
} from "@/controllers/customers.controller";
import passport from "../../auth/passport";
import { User } from "@prisma/client";
import { generateAccessToken } from "@/services/auth.service";
import { googleLogin } from "@/controllers/auth/auth.controller";

const router = Router();
// Google auth
router
  .route("/google")
  .get(passport.authenticate("google", { scope: ["email", "profile"] }));
router
  .route("/google/callback")
  .get(passport.authenticate("google", { session: false }), googleLogin);
router.route("/").get(verifyJWT, verifyRoles("ADMIN"), fetchCustomers);

router.route("/:id").get(verifyJWT, verifyRoles("ADMIN"), fetchCustomerById);

export default router;
