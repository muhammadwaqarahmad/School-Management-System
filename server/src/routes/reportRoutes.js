import express from "express";
import { 
  getFinancialOverview,
  getMonthlyFeeReport,
  getMonthlySalaryReport,
  getStudentFeeHistory,
  getEmployeeSalaryHistory,
  getDefaulters,
  generateMonthly,
  autoGenerate,
  getIncomeReport
} from "../controllers/reportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly, adminOrAccountant } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * RBAC IMPLEMENTATION FOR REPORTS
 * ================================
 * ADMIN: Access to ALL reports (financial + academic)
 * ACCOUNTANT: Access to FINANCIAL reports only
 */

// Financial Overview - Both Admin and Accountant
router.get("/overview", adminOrAccountant, getFinancialOverview);

// Monthly Fee Report - Both Admin and Accountant (financial data)
router.get("/fees/month/:month", adminOrAccountant, getMonthlyFeeReport);

// Monthly Salary Report - Both Admin and Accountant (financial data)
router.get("/salaries/month/:month", adminOrAccountant, getMonthlySalaryReport);

// Student Fee History - Both Admin and Accountant (financial data)
router.get("/student/:studentId/fees", adminOrAccountant, getStudentFeeHistory);

// Employee Salary History - ADMIN ONLY (contains employee data)
router.get("/employee/:employeeId/salaries", adminOnly, getEmployeeSalaryHistory);

// Defaulters List - Both Admin and Accountant (financial data)
router.get("/defaulters", adminOrAccountant, getDefaulters);

// Generate Monthly Records - Admin Only
router.post("/generate-monthly", adminOnly, generateMonthly);

// Auto-generate check - Admin Only
router.get("/auto-generate", adminOnly, autoGenerate);

// Income Report - Both Admin and Accountant (financial data)
router.get("/income", adminOrAccountant, getIncomeReport);

export default router;

