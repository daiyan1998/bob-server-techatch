import { Router } from "express";
import { verifyJWTCustomer } from "@/middlewares/auth";
import {
  getCustomerNotification,
  updateNotificationCustomer,
} from "@/controllers/notifications.controller";

const router = Router();

router.route("/").get(verifyJWTCustomer, getCustomerNotification);

router.route("/:id").patch(verifyJWTCustomer, updateNotificationCustomer);

export default router;
