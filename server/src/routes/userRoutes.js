import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication and SUPER_ADMIN or ADMIN role
router.use(authMiddleware);
router.use(adminOnly);

router.route("/")
  .get(getUsers)
  .post(createUser);

router.route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.post("/:id/reset-password", resetUserPassword);

export default router;

