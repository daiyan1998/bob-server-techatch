import { getMe, updateUser, changePassword } from "@/controllers/me.controller";
import { verifyJWT } from "@/middlewares/auth";
import { Router } from "express";
import upload from "../../middlewares/multer";
import validate from "@/middlewares/validate";
import { updateUserSchema, changePasswordSchema } from "@/validations/user";
const router = Router();

router
  .route("/")
  .get(verifyJWT, getMe)
  .patch(
    verifyJWT,
    upload.single("image"),
    validate(updateUserSchema),
    updateUser,
  );

router.patch(
  "/password",
  verifyJWT,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
