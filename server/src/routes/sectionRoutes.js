import express from "express";
import {
  getSectionsByClass,
  getSection,
  createSection,
  updateSection,
  deleteSection
} from "../controllers/sectionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly, adminOrAccountant } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get all sections for a class - All roles can view
router.get("/class/:classId", adminOrAccountant, getSectionsByClass);

// Create new section - ADMIN ONLY
router.post("/class/:classId", adminOnly, createSection);

// Get single section - All roles can view
router.get("/:id", adminOrAccountant, getSection);

// Update section - ADMIN ONLY
router.put("/:id", adminOnly, updateSection);

// Delete section - ADMIN ONLY
router.delete("/:id", adminOnly, deleteSection);

export default router;

