import { Router } from "express";
import upload from "../../middlewares/multer";
import { verifyJWT, verifyRoles } from "@/middlewares/auth";
import validate from "@/middlewares/validate";
import {
  createAdminUserSchema,
  updateUserSchema,
  changePasswordByAdminSchema,
  userIdSchema,
} from "@/validations/user";
import {
  registerAdmin,
  fetchUsers,
  fetchUser,
  removeUser,
  updateUser,
  changePassword,
} from "@/controllers/users.controller";

const router = Router();

router.get("/", verifyJWT, verifyRoles("ADMIN"), fetchUsers);
router
  .get(
    "/:userId",
    verifyJWT,
    verifyRoles("ADMIN"),
    validate(userIdSchema),
    fetchUser,
  )
  .patch(
    "/:userId",
    verifyJWT,
    upload.single("image"),
    validate(updateUserSchema),
    verifyRoles("ADMIN"),
    validate(userIdSchema),
    updateUser,
  );

router.patch(
  "/password/:userId",
  validate(changePasswordByAdminSchema),
  verifyJWT,
  verifyRoles("ADMIN"),
  validate(userIdSchema),
  changePassword,
);
router.post(
  "/",
  verifyJWT,
  verifyRoles("ADMIN"),
  upload.single("image"),
  validate(createAdminUserSchema),
  registerAdmin,
);

router.delete(
  "/:userId",
  verifyJWT,
  verifyRoles("ADMIN"),
  validate(userIdSchema),
  removeUser,
);

export default router;
