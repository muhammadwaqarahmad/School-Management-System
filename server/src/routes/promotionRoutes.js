import express from "express";
import { 
  promoteStudents,
  getPromotionHistory,
  getClassesForPromotion
} from "../controllers/promotionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * RBAC IMPLEMENTATION FOR PROMOTIONS
 * ===================================
 * ADMIN ONLY: Can promote students
 */

// Promote students
router.post("/promote", adminOnly, promoteStudents);

// Get promotion history
router.get("/history", adminOnly, getPromotionHistory);

// Get classes for promotion dropdown
router.get("/classes", adminOnly, getClassesForPromotion);

export default router;

