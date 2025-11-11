/**
 * REPORT SERVICE
 * ==============
 * Handles all report and analytics API calls
 */

import API from './api';

const reportService = {
  // Get financial overview (dashboard stats)
  getFinancialOverview: async () => {
    return await API.get('/reports/overview');
  },

  // Get monthly fee report
  getMonthlyFeeReport: async (month) => {
    return await API.get(`/reports/fees/month/${month}`);
  },

  // Get monthly salary report
  getMonthlySalaryReport: async (month) => {
    return await API.get(`/reports/salaries/month/${month}`);
  },

  // Get student fee history
  getStudentFeeHistory: async (studentId) => {
    return await API.get(`/reports/student/${studentId}/fees`);
  },

  // Get employee salary history
  getEmployeeSalaryHistory: async (employeeId) => {
    return await API.get(`/reports/employee/${employeeId}/salaries`);
  },

  // Get list of defaulters (unpaid fees)
  getDefaulters: async () => {
    return await API.get('/reports/defaulters');
  },

  // Get income report
  getIncomeReport: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/reports/income${queryString ? `?${queryString}` : ''}`);
  },
};

export default reportService;

