import { PrismaClient } from "@prisma/client";
import { validatePaymentData } from "../utils/validators.js";
import { sendSuccess, sendError, sendNotFound, sendValidationError, sendCreated } from "../utils/responseHelpers.js";
import { parseInteger } from "../utils/dbHelpers.js";
import { getCurrentMonthYear } from "../utils/dateHelpers.js";
import logger from "../config/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

// Helper function to determine fee status
const getFeeStatus = (fee) => {
  if (fee.paid) return 'paid';
  
  // Parse month string (e.g., "January 2025")
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const [monthName, year] = fee.month.split(' ');
  const monthIndex = monthNames.indexOf(monthName);
  
  if (monthIndex === -1) return 'pending';
  
  const feeDate = new Date(parseInt(year), monthIndex, 1);
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // If fee month is before current month and unpaid, it's overdue
  if (feeDate < currentMonth) {
    return 'overdue';
  }
  
  return 'pending';
};

// Get all fees
export const getFees = asyncHandler(async (req, res) => {
  const { studentId, paid, month, status, class: className, showPastFees } = req.query;
  
  const where = {};
  if (studentId) where.studentId = parseInteger(studentId);
  if (paid !== undefined) where.paid = paid === 'true';
  if (month) where.month = month;
    
    // If filtering by class, need to filter through student relation
    let fees = await prisma.fee.findMany({
      where,
      include: { 
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            class: true,
            section: true,
            program: true,
            session: true
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

    // Determine if we should show past fees or current/future fees
    const currentDate = new Date();
    const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    if (showPastFees === 'true') {
      // Show only past fees (before current month)
      fees = fees.filter(fee => {
        const [monthName, year] = fee.month.split(' ');
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex === -1) return false;
        const feeDate = new Date(parseInt(year), monthIndex, 1);
        return feeDate < currentMonthDate;
      });
    } else if (showPastFees === 'false') {
      // Show only current and future fees
      fees = fees.filter(fee => {
        const [monthName, year] = fee.month.split(' ');
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex === -1) return false;
        const feeDate = new Date(parseInt(year), monthIndex, 1);
        return feeDate >= currentMonthDate;
      });
    }
    // If showPastFees is not specified, show all fees

    // Filter by class if specified (use historical class for past fees, current class for current fees)
    if (className) {
      fees = fees.filter(fee => {
        const isPastFee = (() => {
          const [monthName, year] = fee.month.split(' ');
          const monthIndex = monthNames.indexOf(monthName);
          if (monthIndex === -1) return false;
          const feeDate = new Date(parseInt(year), monthIndex, 1);
          return feeDate < currentMonthDate;
        })();
        
        // For past fees, use historical class; for current fees, use current student class
        if (isPastFee && fee.historicalClass) {
          return fee.historicalClass === className;
        }
        return fee.student?.class === className;
      });
    }

    // Add status to each fee and filter by status if specified
    // For past fees, use historical data for display
    fees = fees.map(fee => {
      const isPastFee = (() => {
        const [monthName, year] = fee.month.split(' ');
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex === -1) return false;
        const feeDate = new Date(parseInt(year), monthIndex, 1);
        return feeDate < currentMonthDate;
      })();

      return {
        ...fee,
        status: getFeeStatus(fee),
        // For past fees, include historical data in the response
        displayClass: isPastFee && fee.historicalClass ? fee.historicalClass : fee.student?.class,
        displayProgram: isPastFee && fee.historicalProgram ? fee.historicalProgram : fee.student?.program,
        displaySection: isPastFee && fee.historicalSection ? fee.historicalSection : fee.student?.section,
        displaySession: isPastFee && fee.historicalSession ? fee.historicalSession : fee.student?.session,
        isPastFee: isPastFee
      };
    });

    // Filter by status if specified
    if (status) {
      fees = fees.filter(fee => fee.status === status);
    }

    // Calculate summary statistics
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.filter(f => f.paid).reduce((sum, fee) => sum + fee.amount, 0);
    const pendingAmount = fees.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
    const overdueAmount = fees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);
    
  sendSuccess(res, { 
    fees, 
    count: fees.length,
    summary: {
      total: {
        amount: totalAmount,
        count: fees.length
      },
      paid: {
        amount: paidAmount,
        count: fees.filter(f => f.paid).length
      },
      pending: {
        amount: pendingAmount,
        count: fees.filter(f => f.status === 'pending').length
      },
      overdue: {
        amount: overdueAmount,
        count: fees.filter(f => f.status === 'overdue').length
      }
    }
  });
});

// Get single fee
export const getFee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const feeId = parseInteger(id);
  
  if (!feeId) {
    return sendError(res, 'Invalid fee ID', 400);
  }
  
  const fee = await prisma.fee.findUnique({
    where: { id: feeId },
    include: { 
      student: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  
  if (!fee) {
    return sendNotFound(res, 'Fee');
  }
  
  sendSuccess(res, { fee });
});

// Create new fee
export const createFee = asyncHandler(async (req, res) => {
  const { amount, month, paid = false, studentId } = req.body;
  
  // Validate input
  const validation = validatePaymentData({ amount, month });
  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }
  
  if (!studentId) {
    return sendError(res, 'Student ID is required', 400);
  }
  
  // Get student data to store historical information
  const student = await prisma.student.findUnique({
    where: { id: parseInteger(studentId) }
  });

  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  const fee = await prisma.fee.create({
    data: { 
      amount: parseFloat(amount), 
      month, 
      paid,
      studentId: parseInteger(studentId),
      // Store historical data at the time of fee creation
      historicalClass: student.class,
      historicalProgram: student.program,
      historicalSection: student.section,
      historicalSession: student.session
    },
    include: { student: true }
  });
  
  sendCreated(res, { fee });
});

// Update fee
export const updateFee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, month, paid } = req.body;
  const feeId = parseInteger(id);
  
  if (!feeId) {
    return sendError(res, 'Invalid fee ID', 400);
  }
  
  const updateData = {};
  if (amount) updateData.amount = parseFloat(amount);
  if (month) updateData.month = month;
  if (paid !== undefined) updateData.paid = paid;
  
  try {
    const fee = await prisma.fee.update({
      where: { id: feeId },
      data: updateData,
      include: { student: true }
    });
    
    sendSuccess(res, { fee }, 'Fee updated successfully');
  } catch (error) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Fee');
    }
    throw error;
  }
});

// Mark fee as paid
export const markFeeAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const feeId = parseInteger(id);
  const userId = req.user?.id;
  
  if (!feeId) {
    return sendError(res, 'Invalid fee ID', 400);
  }
  
  try {
    const fee = await prisma.fee.update({
      where: { id: feeId },
      data: { 
        paid: true,
        paidDate: new Date(),
        paidBy: userId || null
      },
      include: { 
        student: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    sendSuccess(res, { fee }, 'Fee marked as paid');
  } catch (error) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Fee');
    }
    throw error;
  }
});

// Delete fee
export const deleteFee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const feeId = parseInteger(id);
  
  if (!feeId) {
    return sendError(res, 'Invalid fee ID', 400);
  }
  
  try {
    await prisma.fee.delete({
      where: { id: feeId }
    });
    
    sendSuccess(res, null, 'Fee deleted successfully');
  } catch (error) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Fee');
    }
    throw error;
  }
});

// Get current user's fees (fees for student linked to current user)
export const getMyFees = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      registrationNo: true,
      name: true
    }
  });

  if (!user) {
    return sendNotFound(res, 'User');
  }

  // Try to find student by email or registration number
  let student = null;
  
  // First try by email
  if (user.email) {
    student = await prisma.student.findFirst({
      where: {
        email: user.email
      }
    });
  }
  
  // If not found by email, try by registration number
  if (!student && user.registrationNo) {
    student = await prisma.student.findUnique({
      where: {
        registrationNo: user.registrationNo
      }
    });
  }

  // If no student found, return empty fees
  if (!student) {
    return sendSuccess(res, {
      fees: [],
      count: 0,
      student: null,
      summary: {
        total: { amount: 0, count: 0 },
        paid: { amount: 0, count: 0 },
        pending: { amount: 0, count: 0 },
        overdue: { amount: 0, count: 0 }
      }
    });
  }

  // Get all past fees for this student (fees before current month)
  const currentDate = new Date();
  const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  let fees = await prisma.fee.findMany({
    where: {
      studentId: student.id
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          rollNo: true,
          class: true,
          section: true,
          program: true,
          session: true
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

  // Filter to only past fees (before current month)
  fees = fees.filter(fee => {
    const [monthName, year] = fee.month.split(' ');
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex === -1) return false;
    const feeDate = new Date(parseInt(year), monthIndex, 1);
    return feeDate < currentMonthDate;
  });

  // Add status to each fee and include historical data
  fees = fees.map(fee => {
    return {
      ...fee,
      status: getFeeStatus(fee),
      // Use historical data for past fees
      displayClass: fee.historicalClass || fee.student?.class || 'N/A',
      displayProgram: fee.historicalProgram || fee.student?.program || 'N/A',
      displaySection: fee.historicalSection || fee.student?.section || 'N/A',
      isPastFee: true
    };
  });

  // Calculate summary statistics
  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const paidAmount = fees.filter(f => f.paid).reduce((sum, fee) => sum + fee.amount, 0);
  const pendingAmount = fees.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
  const overdueAmount = fees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);
  
  sendSuccess(res, {
    fees,
    count: fees.length,
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      class: student.class,
      program: student.program,
      session: student.session
    },
    summary: {
      total: {
        amount: totalAmount,
        count: fees.length
      },
      paid: {
        amount: paidAmount,
        count: fees.filter(f => f.paid).length
      },
      pending: {
        amount: pendingAmount,
        count: fees.filter(f => f.status === 'pending').length
      },
      overdue: {
        amount: overdueAmount,
        count: fees.filter(f => f.status === 'overdue').length
      }
    }
  });
});
