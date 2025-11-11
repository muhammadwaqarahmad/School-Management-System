import express from "express";
import { 
  getEmployees, 
  getEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  searchEmployees,
  changeEmployeeStatus,
  getFormerEmployees
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * RBAC IMPLEMENTATION FOR EMPLOYEES
 * ==================================
 * ADMIN: Full CRUD access (view, create, update, delete)
 * ACCOUNTANT: NO ACCESS (completely restricted)
 */

// ALL Employee routes are ADMIN ONLY

// Get all employees - ADMIN ONLY
router.get("/", adminOnly, getEmployees);

// Get former employees (RESIGNED/TERMINATED/RETIRED) - ADMIN ONLY
router.get("/former", adminOnly, getFormerEmployees);

// Search employees - ADMIN ONLY
router.get("/search", adminOnly, searchEmployees);

// Create new employee - ADMIN ONLY
router.post("/", adminOnly, createEmployee);

// Get single employee - ADMIN ONLY
router.get("/:id", adminOnly, getEmployee);

// Update employee - ADMIN ONLY
router.put("/:id", adminOnly, updateEmployee);

// Delete employee - ADMIN ONLY
router.delete("/:id", adminOnly, deleteEmployee);

// Change employee status (Mark as Former / Terminate) - ADMIN ONLY
router.patch("/:id/status", adminOnly, changeEmployeeStatus);

export default router;
