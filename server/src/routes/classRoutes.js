import express from "express";
import { 
  getClasses, 
  getClass, 
  createClass, 
  updateClass, 
  deleteClass 
} from "../controllers/classController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly, adminOrAccountant } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * RBAC IMPLEMENTATION FOR CLASSES
 * ================================
 * ADMIN: Full CRUD access
 * ACCOUNTANT: Read-Only access
 */

// Get all classes - Both Admin and Accountant can view
router.get("/", adminOrAccountant, getClasses);

// Create new class - ADMIN ONLY
router.post("/", adminOnly, createClass);

// Get single class - Both Admin and Accountant can view
router.get("/:id", adminOrAccountant, getClass);

// Update class - ADMIN ONLY
router.put("/:id", adminOnly, updateClass);

// Delete class - ADMIN ONLY
router.delete("/:id", adminOnly, deleteClass);

export default router;

