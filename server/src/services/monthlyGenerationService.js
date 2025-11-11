import { PrismaClient } from "@prisma/client";
import logger from "../config/logger.js";
import { getCurrentMonthYear } from "../utils/dateHelpers.js";

const prisma = new PrismaClient();

/**
 * Monthly Generation Service
 * Automatically generates fees for students and salaries for employees every month
 */

// Get current month in format "January 2025"
const getCurrentMonth = getCurrentMonthYear;

// Generate fee for a single student for current month
export const generateFeeForStudent = async (studentId, month = getCurrentMonth()) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        fees: {
          where: { month }
        }
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

      // Check if fee already exists for this month
      if (student.fees.length > 0) {
      return { success: true, message: 'Fee already exists for this month', fee: student.fees[0] };
      }

      // Get program fee
      const programFee = await prisma.programFee.findUnique({
        where: { program: student.program }
      });

      if (!programFee) {
      throw new Error(`No program fee found for ${student.program}`);
      }

      // Create fee with historical data
      const fee = await prisma.fee.create({
        data: {
          amount: programFee.feeAmount,
          month,
          paid: false,
          studentId: student.id,
          // Store historical data at the time of fee creation
          historicalClass: student.class,
          historicalProgram: student.program,
          historicalSection: student.section,
          historicalSession: student.session
        }
      });

    return { success: true, fee };
  } catch (error) {
    console.error('Error generating fee for student:', error);
    throw error;
  }
};

// Helper function to check if a fee is overdue
const isFeeOverdue = (feeMonth) => {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const [monthName, year] = feeMonth.split(' ');
  const monthIndex = monthNames.indexOf(monthName);
  
  if (monthIndex === -1) return false;
  
  const feeDate = new Date(parseInt(year), monthIndex, 1);
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  return feeDate < currentMonth;
};

// Generate fees for all active students
export const generateMonthlyFees = async (month = getCurrentMonth()) => {
  try {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    // Only get ACTIVE students with ALL their fees (to check for overdue)
    const students = await prisma.student.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        fees: {
          orderBy: { month: 'desc' }
        }
      }
    });

    const newFees = [];
    const skipped = [];
    const studentsWithOverdue = [];

    for (const student of students) {
      // Check if fee already exists for this month
      const feeForThisMonth = student.fees.find(f => f.month === month);
      if (feeForThisMonth) {
        skipped.push(`${student.name} (${student.program})`);
        continue;
      }

      // Check for overdue fees (unpaid fees from previous months)
      const overdueFees = student.fees.filter(fee => {
        if (fee.paid) return false;
        return isFeeOverdue(fee.month);
      });

      const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.amount, 0);
      const overdueCount = overdueFees.length;

      // Track students with overdue fees
      if (overdueCount > 0) {
        studentsWithOverdue.push({
          studentName: student.name,
          rollNo: student.rollNo,
          program: student.program,
          overdueCount,
          overdueAmount,
          overdueMonths: overdueFees.map(f => f.month)
        });
      }

      // Get program fee
      const programFee = await prisma.programFee.findUnique({
        where: { program: student.program }
      });

      if (!programFee) {
        console.log(`⚠️ No program fee found for ${student.program} - skipping ${student.name}`);
        continue;
      }

      // Create fee with unpaid status and store historical data
      // Even if student has overdue fees, generate new month's fee
      const fee = await prisma.fee.create({
        data: {
          amount: programFee.feeAmount,
          month,
          paid: false, // Always unpaid on generation
          studentId: student.id,
          // Store historical data at the time of fee creation
          historicalClass: student.class,
          historicalProgram: student.program,
          historicalSection: student.section,
          historicalSession: student.session
        }
      });

      newFees.push({
        ...fee,
        hasOverdueFees: overdueCount > 0,
        overdueAmount: overdueAmount
      });
    }

    console.log(`✅ Generated ${newFees.length} new fees for ${month}`);
    if (skipped.length > 0) {
      console.log(`⏭️  Skipped ${skipped.length} students (fees already exist)`);
    }
    
    // Log students with overdue fees
    if (studentsWithOverdue.length > 0) {
      console.log(`\n⚠️  WARNING: ${studentsWithOverdue.length} students have overdue fees:`);
      studentsWithOverdue.forEach(item => {
        console.log(`   - ${item.studentName} (${item.rollNo}): ${item.overdueCount} overdue fee(s) = ${item.overdueAmount.toFixed(2)} PKR`);
        console.log(`     Overdue months: ${item.overdueMonths.join(', ')}`);
      });
      console.log(`\n📋 New fees generated for these students, but they still have ${studentsWithOverdue.reduce((sum, s) => sum + s.overdueCount, 0)} overdue fee(s) from previous months.\n`);
    }

    return { 
      success: true, 
      count: newFees.length, 
      fees: newFees,
      skipped: skipped.length,
      studentsWithOverdue: {
        count: studentsWithOverdue.length,
        details: studentsWithOverdue,
        totalOverdueAmount: studentsWithOverdue.reduce((sum, s) => sum + s.overdueAmount, 0),
        totalOverdueCount: studentsWithOverdue.reduce((sum, s) => sum + s.overdueCount, 0)
      }
    };
  } catch (error) {
    console.error('Error generating monthly fees:', error);
    throw error;
  }
};

// Generate salary for a single employee for current month
export const generateSalaryForEmployee = async (employeeId, month = getCurrentMonth(), userId = null) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        salaries: {
          where: { month }
        }
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if salary already exists for this month
    if (employee.salaries.length > 0) {
      return { success: true, message: 'Salary already exists for this month', salary: employee.salaries[0] };
    }

    // Create salary with unpaid status
    const salary = await prisma.salary.create({
      data: {
        amount: employee.salary,
        month,
        paid: false,
        employeeId: employee.id
      }
    });

    // Always create corresponding expense linked to this salary
    // If no userId provided (auto-generation), find the first admin user or skip expense creation
    let expenseCreatorId = userId;
    
    if (!expenseCreatorId) {
      // Try to find the first admin/super admin user
      const adminUser = await prisma.user.findFirst({
        where: {
          role: {
            in: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      });
      expenseCreatorId = adminUser?.id || null;
    }
    
    // Only create expense if we have a valid user ID
    if (expenseCreatorId) {
      try {
        await prisma.expense.create({
          data: {
            category: 'Salary',
            description: `Salary for ${employee.name} - ${employee.position}`,
            amount: employee.salary,
            month,
            paid: false, // Expense unpaid when salary is unpaid
            salaryId: salary.id,
            createdBy: expenseCreatorId
          }
        });
      } catch (expenseError) {
        console.error('Failed to create expense for salary:', expenseError);
        // Don't fail salary creation if expense creation fails
      }
    } else {
      console.warn('No admin user found to create expense for salary. Expense will be created later.');
    }

    return { success: true, salary };
  } catch (error) {
    console.error('Error generating salary for employee:', error);
    throw error;
  }
};

// Generate salaries for all employees
export const generateMonthlySalaries = async (month = getCurrentMonth(), userId = null) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        salaries: {
          where: { month }
        }
      }
    });

    const newSalaries = [];

    for (const employee of employees) {
      // Check if salary already exists for this month
      if (employee.salaries.length > 0) {
        console.log(`Salary already exists for ${employee.name} for ${month}`);
        continue;
      }

      // Create salary
      const salary = await prisma.salary.create({
        data: {
          amount: employee.salary,
          month,
          paid: false,
          employeeId: employee.id
        }
      });

      // Create corresponding expense if userId is provided
      if (userId) {
        await prisma.expense.create({
          data: {
            category: 'Salary',
            description: `Salary for ${employee.name} - ${employee.position}`,
            amount: employee.salary,
            month,
            paid: false,
            salaryId: salary.id,
            createdBy: userId
          }
        });
      }

      newSalaries.push(salary);
    }

    console.log(`Generated ${newSalaries.length} salaries for ${month}`);
    return { success: true, count: newSalaries.length, salaries: newSalaries };
  } catch (error) {
    console.error('Error generating monthly salaries:', error);
    throw error;
  }
};

// Generate both fees and salaries for the month
export const generateMonthlyRecords = async (month = getCurrentMonth(), userId = null) => {
  try {
    const fees = await generateMonthlyFees(month);
    const salaries = await generateMonthlySalaries(month, userId);

    return {
      success: true,
      month,
      fees: fees.count,
      salaries: salaries.count
    };
  } catch (error) {
    console.error('Error generating monthly records:', error);
    throw error;
  }
};

// Check if it's the 1st of the month
const isFirstDayOfMonth = () => {
  const today = new Date();
  return today.getDate() === 1;
};

// Check if generation is needed for current month (runs daily check)
export const checkAndGenerateIfNeeded = async () => {
  const month = getCurrentMonth();
  const isFirstDay = isFirstDayOfMonth();
  
  try {
    // On the 1st of the month, always generate fees for active students
    if (isFirstDay) {
      console.log(`\n📅 It's the 1st of the month - Generating fees for all active students...`);
      console.log(`📆 Month: ${month}\n`);
      
      // Generate fees for all active students (will skip if fee already exists)
      const feesResult = await generateMonthlyFees(month);
      
      // Also generate salaries
      const salariesResult = await generateMonthlySalaries(month);
      
      // Log summary with overdue information
      let summaryMessage = `✅ Monthly fee generation completed:\n`;
      summaryMessage += `   - Generated ${feesResult.count} new fees\n`;
      summaryMessage += `   - Skipped ${feesResult.skipped} students (fees already exist)\n`;
      summaryMessage += `   - Generated ${salariesResult.count} salaries\n`;
      
      if (feesResult.studentsWithOverdue.count > 0) {
        summaryMessage += `\n⚠️  OVERDUE FEES ALERT:\n`;
        summaryMessage += `   - ${feesResult.studentsWithOverdue.count} students have overdue fees\n`;
        summaryMessage += `   - Total overdue fees: ${feesResult.studentsWithOverdue.totalOverdueCount}\n`;
        summaryMessage += `   - Total overdue amount: ${feesResult.studentsWithOverdue.totalOverdueAmount.toFixed(2)} PKR\n`;
        summaryMessage += `   - New fees were generated, but previous overdue fees remain unpaid.\n`;
      }
      
      console.log(summaryMessage);
      
      return {
        success: true,
        month,
        isFirstDay: true,
        fees: feesResult.count,
        feesSkipped: feesResult.skipped,
        salaries: salariesResult.count,
        overdueInfo: feesResult.studentsWithOverdue,
        message: summaryMessage
      };
    }

    // On other days, only generate if no records exist for current month
    const feesExist = await prisma.fee.findFirst({
      where: { month }
    });

    const salariesExist = await prisma.salary.findFirst({
      where: { month }
    });

    if (!feesExist || !salariesExist) {
      console.log('Auto-generating monthly records (not first day but records missing)...');
      return await generateMonthlyRecords(month);
    }

    console.log('Monthly records already exist for', month);
    return { success: true, message: 'Records already exist', isFirstDay: false };
  } catch (error) {
    console.error('Error in auto-generation check:', error);
    throw error;
  }
};

// Scheduled task runner - checks daily if it's the 1st and generates fees
export const startMonthlyFeeScheduler = () => {
  console.log('📅 Monthly fee scheduler started. Will check daily for 1st of month...');
  
  // Run immediately on startup if it's the 1st
  checkAndGenerateIfNeeded().catch(err => {
    console.error('Error in initial monthly fee check:', err);
  });

  // Schedule daily check at 12:01 AM (right after midnight)
  const scheduleDailyCheck = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 12:01 AM tomorrow
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      // Run the check
      checkAndGenerateIfNeeded().catch(err => {
        console.error('Error in scheduled monthly fee check:', err);
      });
      
      // Schedule next check (every 24 hours)
      setInterval(() => {
        checkAndGenerateIfNeeded().catch(err => {
          console.error('Error in scheduled monthly fee check:', err);
        });
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }, msUntilMidnight);
  };

  scheduleDailyCheck();
};

