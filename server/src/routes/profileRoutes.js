import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * PROFILE ROUTES
 * ==============
 * Manage user profile information
 * Accessible to all authenticated users
 */

// Get current user profile
router.get("/", getProfile);

// Update current user profile
router.put("/", updateProfile);

// Change password
router.post("/change-password", changePassword);

export default router;

