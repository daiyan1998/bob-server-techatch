import { Router } from "express";
import { verifyJWT } from "@/middlewares/auth";
import {
  getAdminNotification,
  updateNotificationAdmin,
} from "@/controllers/notifications.controller";

const router = Router();

router.route("/").get(verifyJWT, getAdminNotification);

router.route("/:id").patch(verifyJWT, updateNotificationAdmin);

export default router;
