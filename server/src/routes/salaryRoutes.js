import express from "express";
import { 
  getSalaries, 
  getSalary, 
  createSalary, 
  updateSalary, 
  markSalaryAsPaid,
  deleteSalary 
} from "../controllers/salaryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOrAccountant } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * RBAC IMPLEMENTATION FOR SALARIES
 * =================================
 * ADMIN: Full CRUD access (view, create, update, delete, mark as paid)
 * ACCOUNTANT: Full CRUD access (primary responsibility for expense/salary management)
 */

// Get all salaries - Both Admin and Accountant
router.get("/", adminOrAccountant, getSalaries);

// Create new salary - Both Admin and Accountant
router.post("/", adminOrAccountant, createSalary);

// Get single salary - Both Admin and Accountant
router.get("/:id", adminOrAccountant, getSalary);

// Update salary - Both Admin and Accountant
router.put("/:id", adminOrAccountant, updateSalary);

// Mark salary as paid - Both Admin and Accountant
router.patch("/:id/pay", adminOrAccountant, markSalaryAsPaid);

// Delete salary - Both Admin and Accountant
router.delete("/:id", adminOrAccountant, deleteSalary);

export default router;
