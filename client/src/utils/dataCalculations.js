/**
 * DATA CALCULATION UTILITIES
 * ===========================
 * Common calculation functions used across multiple pages
 */

/**
 * Calculate fee statistics for a student
 * @param {Object} student - Student object with fees array
 * @returns {Object} Fee statistics object
 */
export const calculateFeeStats = (student) => {
  if (!student.fees || student.fees.length === 0) {
    return {
      totalMonths: 0,
      paidMonths: 0,
      unpaidMonths: 0,
      overdueMonths: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      overdueAmount: 0,
      remainingAmount: 0
    };
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const totalMonths = student.fees.length;
  const paidFees = student.fees.filter(f => f.paid);
  const unpaidFees = student.fees.filter(f => !f.paid);
  
  const paidMonths = paidFees.length;
  const unpaidMonths = unpaidFees.length;

  // Calculate overdue fees
  const overdueFees = unpaidFees.filter(fee => {
    const [monthName, year] = fee.month.split(' ');
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex === -1) return false;
    const feeDate = new Date(parseInt(year), monthIndex, 1);
    return feeDate < currentMonth;
  });
  const overdueMonths = overdueFees.length;

  // Calculate amounts
  const totalAmount = student.fees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
  const paidAmount = paidFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
  const unpaidAmount = unpaidFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
  const overdueAmount = overdueFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
  const remainingAmount = unpaidAmount; // Remaining = unpaid amount

  return {
    totalMonths,
    paidMonths,
    unpaidMonths,
    overdueMonths,
    totalAmount,
    paidAmount,
    unpaidAmount,
    overdueAmount,
    remainingAmount
  };
};

/**
 * Calculate salary statistics for an employee
 * @param {Object} employee - Employee object with salaries array
 * @returns {Object} Salary statistics object
 */
export const calculateSalaryStats = (employee) => {
  if (!employee.salaries || employee.salaries.length === 0) {
    return {
      totalMonths: 0,
      paidMonths: 0,
      unpaidMonths: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      remainingAmount: 0
    };
  }

  const totalMonths = employee.salaries.length;
  const paidSalaries = employee.salaries.filter(s => s.paid);
  const unpaidSalaries = employee.salaries.filter(s => !s.paid);
  
  const paidMonths = paidSalaries.length;
  const unpaidMonths = unpaidSalaries.length;

  const totalAmount = employee.salaries.reduce((sum, salary) => sum + parseFloat(salary.amount || 0), 0);
  const paidAmount = paidSalaries.reduce((sum, salary) => sum + parseFloat(salary.amount || 0), 0);
  const unpaidAmount = unpaidSalaries.reduce((sum, salary) => sum + parseFloat(salary.amount || 0), 0);
  const remainingAmount = unpaidAmount;

  return {
    totalMonths,
    paidMonths,
    unpaidMonths,
    totalAmount,
    paidAmount,
    unpaidAmount,
    remainingAmount
  };
};

/**
 * Get current month as formatted string (e.g., "January 2025")
 * @returns {string} Formatted month string
 */
export const getCurrentMonth = () => {
  const date = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

