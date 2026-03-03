import { Router } from "express";
import { verifyJWT, verifyJWTCustomer, verifyRoles } from "@/middlewares/auth";
import validate from "@/middlewares/validate";
import {
    getCustomerRefundRequestsController,
    getRefundRequestByIdController,

} from "@/controllers/refunds.controller";

import { getRefundRequestsSchema } from "@/validations/refund";

const router = Router();

router
    .route("/")
    .get(
        verifyJWTCustomer,
        validate(getRefundRequestsSchema),
        getCustomerRefundRequestsController
    );

router
    .route("/:id")
    .get(
        verifyJWT,
        getRefundRequestByIdController
    );


export default router;