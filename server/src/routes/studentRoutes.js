import express from "express";
import { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  searchStudents,
  changeStudentStatus,
  getAlumni
} from "../controllers/studentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly, adminOrAccountant } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * RBAC IMPLEMENTATION FOR STUDENTS
 * =================================
 * ADMIN: Full CRUD access
 * ACCOUNTANT: Read-Only access (view students only)
 */

// Search students - Both Admin and Accountant can search
router.get("/search", adminOrAccountant, searchStudents);

// Get alumni (GRADUATED/DROPPED students) - Both Admin and Accountant can view
router.get("/alumni", adminOrAccountant, getAlumni);

// Get all students - Both Admin and Accountant can view
router.get("/", adminOrAccountant, getStudents);

// Create new student - ADMIN ONLY
router.post("/", adminOnly, createStudent);

// Get single student - Both Admin and Accountant can view
router.get("/:id", adminOrAccountant, getStudent);

// Update student - ADMIN ONLY
router.put("/:id", adminOnly, updateStudent);

// Delete student - ADMIN ONLY
router.delete("/:id", adminOnly, deleteStudent);

// Change student status (Promote to Alumni / Mark as Dropped) - ADMIN ONLY
router.patch("/:id/status", adminOnly, changeStudentStatus);

export default router;
