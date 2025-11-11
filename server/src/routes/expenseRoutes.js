import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  markAsPaid,
  getExpenseStats
} from '../controllers/expenseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly, adminOrAccountant } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// All three roles can access expenses (adminOrAccountant allows SUPER_ADMIN, ADMIN, ACCOUNTANT)
router.get('/', adminOrAccountant, getExpenses);
router.get('/stats', adminOrAccountant, getExpenseStats);
router.get('/:id', adminOrAccountant, getExpense);
router.post('/', adminOrAccountant, createExpense);
router.put('/:id', adminOrAccountant, updateExpense);
router.patch('/:id/pay', adminOrAccountant, markAsPaid);
router.delete('/:id', adminOrAccountant, deleteExpense);

export default router;

