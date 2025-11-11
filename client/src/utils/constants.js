/**
 * CONSTANTS
 * =========
 * Application-wide constants matching backend constants
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const API_BASE_URL = 'http://localhost:5000/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  EMPLOYEES: '/employees',
  FEES: '/fees',
  SALARIES: '/salaries',
  REPORTS: '/reports',
};

