import express from "express";
import { 
  getFees, 
  getFee, 
  createFee, 
  updateFee, 
  markFeeAsPaid,
  deleteFee,
  getMyFees
} from "../controllers/feeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOrAccountant } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * RBAC IMPLEMENTATION FOR FEES
 * =============================
 * ADMIN: Full CRUD access (view, create, update, delete, mark as paid)
 * ACCOUNTANT: Full CRUD access (primary responsibility for fee management)
 * ALL USERS: Can view their own past fees via /my-fees endpoint
 */

// Get current user's past fees - All authenticated users can access
router.get("/my-fees", getMyFees);

// Get all fees - Both Admin and Accountant
router.get("/", adminOrAccountant, getFees);

// Create new fee - Both Admin and Accountant
router.post("/", adminOrAccountant, createFee);

// Get single fee - Both Admin and Accountant
router.get("/:id", adminOrAccountant, getFee);

// Update fee - Both Admin and Accountant
router.put("/:id", adminOrAccountant, updateFee);

// Mark fee as paid - Both Admin and Accountant
router.patch("/:id/pay", adminOrAccountant, markFeeAsPaid);

// Delete fee - Both Admin and Accountant
router.delete("/:id", adminOrAccountant, deleteFee);

export default router;
