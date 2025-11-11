import express from "express";
import {
  getProgramFees,
  getProgramFee,
  createProgramFee,
  updateProgramFee,
  deleteProgramFee,
  getProgramSessions,
  createProgramSession,
  updateProgramSession,
  deleteProgramSession,
  setCurrentProgramSession,
  // New endpoints
  getPrograms,
  getProgram,
  getProgramSessionsById,
  createProgram,
  updateProgram,
  deleteProgram,
  getFees,
  createFee,
  updateFee,
  deleteFee
} from "../controllers/settingsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * SETTINGS ROUTES - ADMIN ONLY
 * =============================
 * Manage sessions, programs, and fees
 */

// ==================== SESSIONS ====================
router.get("/sessions", adminOnly, getProgramSessions);
router.post("/sessions", adminOnly, createProgramSession);
router.put("/sessions/:id", adminOnly, updateProgramSession);
router.delete("/sessions/:id", adminOnly, deleteProgramSession);
router.post("/sessions/:id/set-current", adminOnly, setCurrentProgramSession);

// ==================== PROGRAMS ====================
// IMPORTANT: Exact routes must come before parameterized routes
// GET /programs (list all) - must come before /programs/:id
router.get("/programs", adminOnly, getPrograms); // Returns programs with sessions
router.post("/programs", adminOnly, createProgram);

// Legacy program fee endpoints (for backward compatibility)
router.get("/programs/:program/fee", adminOnly, getProgramFee);

// New program endpoints (separate from fees)
router.get("/programs/:programId/sessions", adminOnly, getProgramSessionsById);
router.get("/programs/:id", adminOnly, getProgram);
router.put("/programs/:id", adminOnly, updateProgram);
router.delete("/programs/:id", adminOnly, deleteProgram);

// ==================== FEES ====================
router.get("/fees", adminOnly, getFees);
router.post("/fees", adminOnly, createFee);
router.put("/fees/:id", adminOnly, updateFee);
router.delete("/fees/:id", adminOnly, deleteFee);

export default router;

