import { getAnalytics } from "@/controllers/analytics.controller";
import { verifyJWT } from "@/middlewares/auth";
import { Router } from "express";

const router = Router();

router.route("/").get(verifyJWT, getAnalytics);

export default router;
