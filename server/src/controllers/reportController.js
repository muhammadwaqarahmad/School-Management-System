import { PrismaClient } from "@prisma/client";
import { HTTP_STATUS } from "../utils/constants.js";
import {
  generateMonthlyFees,
  generateMonthlySalaries,
  generateMonthlyRecords,
  checkAndGenerateIfNeeded
} from "../services/monthlyGenerationService.js";

const prisma = new PrismaClient();

// Get financial overview
export const getFinancialOverview = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    
    // Total students
    const totalStudents = await prisma.student.count();
    
    // Total employees
    const totalEmployees = await prisma.employee.count();
    
    // Fee collection stats
    const feeStats = await prisma.fee.aggregate({
      _sum: { amount: true },
      _count: true
    });
    
    const paidFees = await prisma.fee.aggregate({
      where: { paid: true },
      _sum: { amount: true },
      _count: true
    });
    
    const unpaidFees = await prisma.fee.aggregate({
      where: { paid: false },
      _sum: { amount: true },
      _count: true
    });
    
    // Salary stats
    const salaryStats = await prisma.salary.aggregate({
      _sum: { amount: true },
      _count: true
    });
    
    const paidSalaries = await prisma.salary.aggregate({
      where: { paid: true },
      _sum: { amount: true },
      _count: true
    });
    
    const unpaidSalaries = await prisma.salary.aggregate({
      where: { paid: false },
      _sum: { amount: true },
      _count: true
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        students: {
          total: totalStudents
        },
        employees: {
          total: totalEmployees
        },
        fees: {
          total: feeStats._sum.amount || 0,
          count: feeStats._count,
          paid: {
            amount: paidFees._sum.amount || 0,
            count: paidFees._count
          },
          unpaid: {
            amount: unpaidFees._sum.amount || 0,
            count: unpaidFees._count
          }
        },
        salaries: {
          total: salaryStats._sum.amount || 0,
          count: salaryStats._count,
          paid: {
            amount: paidSalaries._sum.amount || 0,
            count: paidSalaries._count
          },
          unpaid: {
            amount: unpaidSalaries._sum.amount || 0,
            count: unpaidSalaries._count
          }
        },
        netProfit: (paidFees._sum.amount || 0) - (paidSalaries._sum.amount || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly fee report
export const getMonthlyFeeReport = async (req, res, next) => {
  try {
    const { month } = req.params;
    
    if (!month) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Month parameter is required'
      });
    }
    
    const fees = await prisma.fee.findMany({
      where: { month },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            class: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.filter(f => f.paid).reduce((sum, fee) => sum + fee.amount, 0);
    const unpaidAmount = fees.filter(f => !f.paid).reduce((sum, fee) => sum + fee.amount, 0);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        month,
        fees,
        summary: {
          total: totalAmount,
          paid: paidAmount,
          unpaid: unpaidAmount,
          count: fees.length,
          paidCount: fees.filter(f => f.paid).length,
          unpaidCount: fees.filter(f => !f.paid).length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly salary report
export const getMonthlySalaryReport = async (req, res, next) => {
  try {
    const { month } = req.params;
    
    if (!month) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Month parameter is required'
      });
    }
    
    const salaries = await prisma.salary.findMany({
      where: { month },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const totalAmount = salaries.reduce((sum, salary) => sum + salary.amount, 0);
    const paidAmount = salaries.filter(s => s.paid).reduce((sum, salary) => sum + salary.amount, 0);
    const unpaidAmount = salaries.filter(s => !s.paid).reduce((sum, salary) => sum + salary.amount, 0);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        month,
        salaries,
        summary: {
          total: totalAmount,
          paid: paidAmount,
          unpaid: unpaidAmount,
          count: salaries.length,
          paidCount: salaries.filter(s => s.paid).length,
          unpaidCount: salaries.filter(s => !s.paid).length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get student fee history
export const getStudentFeeHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        fees: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const totalFees = student.fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = student.fees.filter(f => f.paid).reduce((sum, fee) => sum + fee.amount, 0);
    const unpaidFees = student.fees.filter(f => !f.paid).reduce((sum, fee) => sum + fee.amount, 0);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class
        },
        fees: student.fees,
        summary: {
          total: totalFees,
          paid: paidFees,
          unpaid: unpaidFees,
          count: student.fees.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get employee salary history
export const getEmployeeSalaryHistory = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: {
        salary: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!employee) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const totalSalary = employee.salary.reduce((sum, sal) => sum + sal.amount, 0);
    const paidSalary = employee.salary.filter(s => s.paid).reduce((sum, sal) => sum + sal.amount, 0);
    const unpaidSalary = employee.salary.filter(s => !s.paid).reduce((sum, sal) => sum + sal.amount, 0);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          position: employee.position
        },
        salaries: employee.salary,
        summary: {
          total: totalSalary,
          paid: paidSalary,
          unpaid: unpaidSalary,
          count: employee.salary.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get defaulters (students with unpaid fees for completed months only)
export const getDefaulters = async (req, res, next) => {
  try {
    // Helper function to check if a month is completed
    const isMonthCompleted = (monthString) => {
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      
      const parts = monthString.split(' ');
      if (parts.length !== 2) return false;
      
      const monthName = parts[0];
      const year = parseInt(parts[1]);
      const monthIndex = monthNames.indexOf(monthName);
      
      if (monthIndex === -1 || isNaN(year)) return false;
      
      // Get the first day of the NEXT month to check if the current month has passed
      const feeMonthEnd = new Date(year, monthIndex + 1, 1); // First day of next month
      const currentDate = new Date();
      
      // Month is completed if we've passed the end of that month
      return currentDate >= feeMonthEnd;
    };

    const studentsWithUnpaidFees = await prisma.student.findMany({
      where: {
        fees: {
          some: {
            paid: false
          }
        }
      },
      include: {
        fees: {
          where: { paid: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    // Filter to only include students with unpaid fees for completed months
    const defaulters = studentsWithUnpaidFees
      .map(student => {
        // Filter fees to only include those for completed months
        const completedMonthFees = student.fees.filter(fee => isMonthCompleted(fee.month));
        
        // Only include students who have unpaid fees for completed months
        if (completedMonthFees.length === 0) return null;
        
        const totalUnpaid = completedMonthFees.reduce((sum, fee) => sum + fee.amount, 0);
        return {
          student: {
            id: student.id,
            name: student.name,
            rollNo: student.rollNo,
            class: student.class,
            program: student.program || null,
            session: student.session || null
          },
          unpaidFees: completedMonthFees,
          totalUnpaid,
          feeCount: completedMonthFees.length
        };
      })
      .filter(defaulter => defaulter !== null); // Remove null entries
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        defaulters,
        count: defaulters.length,
        totalUnpaidAmount: defaulters.reduce((sum, d) => sum + d.totalUnpaid, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate monthly fees and salaries
export const generateMonthly = async (req, res, next) => {
  try {
    const { month } = req.body;
    const userId = req.user.id;

    const result = await generateMonthlyRecords(month, userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Generated ${result.fees} fees and ${result.salaries} salaries for ${result.month}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Auto-check and generate if needed
export const autoGenerate = async (req, res, next) => {
  try {
    const result = await checkAndGenerateIfNeeded();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get income report (fees collected, salaries paid, expenses, net profit)
export const getIncomeReport = async (req, res, next) => {
  try {
    const { reportType, month, year, startDate, endDate } = req.query;

    if (!reportType || !['monthly', 'yearly', 'custom'].includes(reportType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid report type. Must be monthly, yearly, or custom'
      });
    }

    let feeWhere = {};
    let salaryWhere = {};
    let expenseWhere = {};
    let reportPeriod = '';

    // Build date filters based on report type
    if (reportType === 'monthly') {
      if (!month) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Month is required for monthly report'
        });
      }
      feeWhere.month = month;
      salaryWhere.month = month;
      expenseWhere.month = month;
      reportPeriod = month;
    } else if (reportType === 'yearly') {
      if (!year) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Year is required for yearly report'
        });
      }
      // For yearly, we'll fetch all and filter client-side
      // Prisma doesn't have easy endsWith for this pattern
      reportPeriod = year;
    } else if (reportType === 'custom') {
      if (!startDate || !endDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Start date and end date are required for custom report'
        });
      }
      // For custom range, we'll filter by month strings that fall within the range
      // This is simplified - we parse month strings and check if they fall in range
      reportPeriod = `${startDate} to ${endDate}`;
    }

    // Get paid fees (income) - filter by month if monthly
    const allPaidFees = await prisma.fee.findMany({
      where: {
        paid: true
      },
      include: {
        student: {
          select: {
            name: true,
            rollNo: true,
            class: true
          }
        }
      }
    });

    // Get paid salaries (expense) - filter by month if monthly
    const allPaidSalaries = await prisma.salary.findMany({
      where: {
        paid: true
      },
      include: {
        employee: {
          select: {
            name: true,
            position: true
          }
        }
      }
    });

    // Get all expenses (including unpaid) - filter by month if monthly
    const allExpensesQuery = await prisma.expense.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Filter based on report type
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    let paidFees = allPaidFees;
    let paidSalaries = allPaidSalaries;
    let allExpenses = allExpensesQuery;

    if (reportType === 'monthly') {
      paidFees = allPaidFees.filter(f => f.month === month);
      paidSalaries = allPaidSalaries.filter(s => s.month === month);
      allExpenses = allExpensesQuery.filter(e => e.month === month);
    } else if (reportType === 'yearly') {
      paidFees = allPaidFees.filter(f => {
        const [, yearStr] = f.month.split(' ');
        return yearStr === year;
      });
      paidSalaries = allPaidSalaries.filter(s => {
        const [, yearStr] = s.month.split(' ');
        return yearStr === year;
      });
      allExpenses = allExpensesQuery.filter(e => {
        const [, yearStr] = e.month.split(' ');
        return yearStr === year;
      });
    }

    // Calculate totals
    const totalIncome = paidFees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalSalaryExpense = paidSalaries.reduce((sum, sal) => sum + sal.amount, 0);
    const totalOtherExpenses = allExpenses
      .filter(e => !e.salaryId) // Exclude salary-linked expenses to avoid double counting
      .reduce((sum, exp) => sum + exp.amount, 0);
    const totalExpenses = totalSalaryExpense + totalOtherExpenses;
    const netProfit = totalIncome - totalExpenses;

    // If custom range, filter by date range
    let filteredFees = paidFees;
    let filteredSalaries = paidSalaries;
    let filteredExpenses = allExpenses;

    if (reportType === 'custom') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      
      filteredFees = allPaidFees.filter(fee => {
        const [monthName, yearStr] = fee.month.split(' ');
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex === -1) return false;
        const feeDate = new Date(parseInt(yearStr), monthIndex, 1);
        return feeDate >= start && feeDate <= end;
      });

      filteredSalaries = allPaidSalaries.filter(sal => {
        const [monthName, yearStr] = sal.month.split(' ');
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex === -1) return false;
        const salaryDate = new Date(parseInt(yearStr), monthIndex, 1);
        return salaryDate >= start && salaryDate <= end;
      });

      filteredExpenses = allExpensesQuery.filter(exp => {
        const [monthName, yearStr] = exp.month.split(' ');
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex === -1) return false;
        const expenseDate = new Date(parseInt(yearStr), monthIndex, 1);
        return expenseDate >= start && expenseDate <= end;
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        reportType,
        reportPeriod,
        period: {
          startDate: reportType === 'custom' ? startDate : null,
          endDate: reportType === 'custom' ? endDate : null,
          month: reportType === 'monthly' ? month : null,
          year: reportType === 'yearly' ? year : null
        },
        income: {
          fees: filteredFees,
          total: filteredFees.reduce((sum, fee) => sum + fee.amount, 0),
          count: filteredFees.length
        },
        expenses: {
          salaries: filteredSalaries,
          otherExpenses: filteredExpenses.filter(e => !e.salaryId),
          totalSalaries: filteredSalaries.reduce((sum, sal) => sum + sal.amount, 0),
          totalOther: filteredExpenses.filter(e => !e.salaryId).reduce((sum, exp) => sum + exp.amount, 0),
          total: filteredSalaries.reduce((sum, sal) => sum + sal.amount, 0) + 
                 filteredExpenses.filter(e => !e.salaryId).reduce((sum, exp) => sum + exp.amount, 0),
          salaryCount: filteredSalaries.length,
          otherCount: filteredExpenses.filter(e => !e.salaryId).length
        },
        summary: {
          totalIncome: filteredFees.reduce((sum, fee) => sum + fee.amount, 0),
          totalExpenses: filteredSalaries.reduce((sum, sal) => sum + sal.amount, 0) + 
                        filteredExpenses.filter(e => !e.salaryId).reduce((sum, exp) => sum + exp.amount, 0),
          netProfit: filteredFees.reduce((sum, fee) => sum + fee.amount, 0) - 
                    (filteredSalaries.reduce((sum, sal) => sum + sal.amount, 0) + 
                     filteredExpenses.filter(e => !e.salaryId).reduce((sum, exp) => sum + exp.amount, 0))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

