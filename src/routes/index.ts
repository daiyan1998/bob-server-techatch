import { Router } from "express";
import refundsRouter from "@/routes/api/refunds.router";
import refundsMeRouter from "@/routes/api/me-refunds.router";

import usersRouter from "@/routes/api/users.router";
import meRouter from "@/routes/api/me.router";
import authRouter from "@/routes/auth/auth.router";
import customerRouter from "@/routes/api/customers.router";
import customerMeRouter from "@/routes/api/me-customer.router";
import customerRequestsMeRouter from "@/routes/api/me-requests.router";
import requestsRouter from "@/routes/api/requests.router";
import supportTicketRouter from "@/routes/api/support-tickets.router";
import customerSupportTicketRouter from "@/routes/api/me-support-tickets.router";
import customerOrderMeRouter from "@/routes/api/me-order.router";
import orderRouter from "@/routes/api/orders.router";
import paymentRouter from "@/routes/api/payments.router";
import notificationCustomerRouter from "@/routes/api/me-notifications.router";
import notificationAdminRouter from "@/routes/api//notifications.router";
import paymentMeRouter from "@/routes/api/me-payments.router";
import analyticsRouter from "@/routes/api/analytics.router";

const router = Router();

// API routes
router.use("/api/v1/users", usersRouter);
router.use("/api/v1/customers", customerRouter);
router.use("/api/v1/me", meRouter);
router.use("/api/v1/me/customer", customerMeRouter);

router.use("/api/v1/me/requests", customerRequestsMeRouter);
router.use("/api/v1/requests", requestsRouter);
router.use("/api/v1/support-ticket", supportTicketRouter);
router.use("/api/v1/me/support-ticket", customerSupportTicketRouter);

router.use("/api/v1/me/notifications", notificationCustomerRouter);
router.use("/api/v1/notifications", notificationAdminRouter);

router.use("/api/v1/me/orders", customerOrderMeRouter);
router.use("/api/v1/orders", orderRouter);

router.use("/api/v1/payments", paymentRouter);
router.use("/api/v1/me/payments", paymentMeRouter);

router.use("/api/v1/analytics", analyticsRouter);

// AUTH routes
router.use("/auth", authRouter);

// Add refund routes
router.use("/api/v1/refunds", refundsRouter);
router.use("/api/v1/me/refunds", refundsMeRouter);

export default router;
