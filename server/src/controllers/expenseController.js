import { PrismaClient } from "@prisma/client";
import { sendSuccess, sendError, sendNotFound, sendCreated } from "../utils/responseHelpers.js";
import { parseInteger } from "../utils/dbHelpers.js";
import logger from "../config/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

// Get all expenses
export const getExpenses = asyncHandler(async (req, res) => {
    const expenses = await prisma.expense.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        salary: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate salary summary (like fee summary)
    const salaryExpenses = expenses.filter(e => e.category === 'Salary');
    const totalSalaryExpenses = salaryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const paidSalaryExpenses = salaryExpenses.filter(e => e.paid).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const unpaidSalaryExpenses = totalSalaryExpenses - paidSalaryExpenses;

    // Calculate total expenses summary
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const paidExpenses = expenses.filter(e => e.paid).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const unpaidExpenses = totalExpenses - paidExpenses;

  sendSuccess(res, {
    expenses,
    count: expenses.length,
    summary: {
      total: {
        amount: totalExpenses,
        count: expenses.length
      },
      paid: {
        amount: paidExpenses,
        count: expenses.filter(e => e.paid).length
      },
      unpaid: {
        amount: unpaidExpenses,
        count: expenses.filter(e => !e.paid).length
      },
      salaries: {
        total: {
          amount: totalSalaryExpenses,
          count: salaryExpenses.length
        },
        paid: {
          amount: paidSalaryExpenses,
          count: salaryExpenses.filter(e => e.paid).length
        },
        unpaid: {
          amount: unpaidSalaryExpenses,
          count: salaryExpenses.filter(e => !e.paid).length
        }
      }
    }
  });
});

// Get single expense
export const getExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expenseId = parseInteger(id);

  if (!expenseId) {
    return sendError(res, 'Invalid expense ID', 400);
  }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      salary: {
        include: {
          employee: true
        }
      }
    }
  });

  if (!expense) {
    return sendNotFound(res, 'Expense');
  }

  sendSuccess(res, { expense });
});

// Create new expense
export const createExpense = asyncHandler(async (req, res) => {
  const { category, description, amount, month, paid, salaryId } = req.body;
  const createdBy = req.user.id;

  // Validate required fields
  if (!category || !description || !amount || !month) {
    return sendError(res, 'Category, description, amount, and month are required', 400);
  }

  const expense = await prisma.expense.create({
    data: {
      category,
      description,
      amount: parseFloat(amount),
      month,
      paid: paid || false,
      salaryId: salaryId ? parseInteger(salaryId) : null,
      createdBy
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  sendCreated(res, { expense }, 'Expense created successfully');
});

// Update expense
export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, description, amount, month, paid } = req.body;
  const expenseId = parseInteger(id);

  if (!expenseId) {
    return sendError(res, 'Invalid expense ID', 400);
  }

  try {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(category && { category }),
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(month && { month }),
        ...(paid !== undefined && { paid })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    sendSuccess(res, { expense }, 'Expense updated successfully');
  } catch (error) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Expense');
    }
    throw error;
  }
});

// Mark expense as paid
export const markAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expenseId = parseInteger(id);

  if (!expenseId) {
    return sendError(res, 'Invalid expense ID', 400);
  }

  try {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: { paid: true },
    });

    // If this expense is linked to a salary, mark the salary as paid too
    if (expense.salaryId) {
      await prisma.salary.update({
        where: { id: expense.salaryId },
        data: { paid: true }
      });
    }

    sendSuccess(res, { expense }, 'Expense marked as paid');
  } catch (error) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Expense');
    }
    throw error;
  }
});

// Delete expense
export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expenseId = parseInteger(id);

  if (!expenseId) {
    return sendError(res, 'Invalid expense ID', 400);
  }

  try {
    await prisma.expense.delete({
      where: { id: expenseId }
    });

    sendSuccess(res, null, 'Expense deleted successfully');
  } catch (error) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Expense');
    }
    throw error;
  }
});

// Get expense statistics
export const getExpenseStats = asyncHandler(async (req, res) => {
  const { month } = req.query;

  const whereClause = month ? { month } : {};

  const expenses = await prisma.expense.findMany({
    where: whereClause
  });

  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const paid = expenses.filter(e => e.paid).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const unpaid = total - paid;

  const byCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});

  sendSuccess(res, {
    total,
    paid,
    unpaid,
    count: expenses.length,
    byCategory
  });
});

