import { PrismaClient } from "@prisma/client";
import { validatePaymentData } from "../utils/validators.js";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/constants.js";

const prisma = new PrismaClient();

// Get all salaries
export const getSalaries = async (req, res, next) => {
  try {
    const { employeeId, paid, month } = req.query;
    
    const where = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (paid !== undefined) where.paid = paid === 'true';
    if (month) where.month = month;
    
    const salaries = await prisma.salary.findMany({
      where,
      include: { 
        employee: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { salaries, count: salaries.length }
    });
  } catch (error) {
    next(error);
  }
};

// Get single salary
export const getSalary = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const salary = await prisma.salary.findUnique({
      where: { id: parseInt(id) },
      include: { 
        employee: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!salary) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { salary }
    });
  } catch (error) {
    next(error);
  }
};

// Create new salary
export const createSalary = async (req, res, next) => {
  try {
    const { amount, month, paid = false, employeeId } = req.body;
    
    // Validate input
    const validation = validatePaymentData({ amount, month });
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    if (!employeeId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    const salary = await prisma.salary.create({
      data: { 
        amount: parseFloat(amount), 
        month, 
        paid,
        employeeId: parseInt(employeeId)
      },
      include: { employee: true }
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: { salary }
    });
  } catch (error) {
    next(error);
  }
};

// Update salary
export const updateSalary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, month, paid } = req.body;
    
    const updateData = {};
    if (amount) updateData.amount = parseFloat(amount);
    if (month) updateData.month = month;
    if (paid !== undefined) updateData.paid = paid;
    
    const salary = await prisma.salary.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { employee: true }
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: { salary }
    });
  } catch (error) {
    next(error);
  }
};

// Mark salary as paid
export const markSalaryAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Get salary with linked expense
    const salary = await prisma.salary.findUnique({
      where: { id: parseInt(id) },
      include: { 
        employee: true
      }
    });

    if (!salary) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Salary not found'
      });
    }
    
    // Update salary to paid with paidDate and paidBy
    const updatedSalary = await prisma.salary.update({
      where: { id: parseInt(id) },
      data: { 
        paid: true,
        paidDate: new Date(),
        paidBy: userId || null
      },
      include: { 
        employee: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Find and update linked expense if it exists
    const linkedExpense = await prisma.expense.findFirst({
      where: { salaryId: parseInt(id) }
    });

    if (linkedExpense) {
      await prisma.expense.update({
        where: { id: linkedExpense.id },
        data: { paid: true }
      });
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Salary marked as paid',
      data: { salary: updatedSalary }
    });
  } catch (error) {
    next(error);
  }
};

// Delete salary
export const deleteSalary = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.salary.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DELETED
    });
  } catch (error) {
    next(error);
  }
};
