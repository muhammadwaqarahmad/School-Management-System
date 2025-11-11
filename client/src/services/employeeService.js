/**
 * EMPLOYEE SERVICE
 * ================
 * Handles all employee-related API calls (CRUD operations)
 */

import API from './api';

const employeeService = {
  // Get all employees
  getAll: async () => {
    return await API.get('/employees');
  },

  // Get single employee by ID
  getById: async (id) => {
    return await API.get(`/employees/${id}`);
  },

  // Create new employee
  create: async (employeeData) => {
    return await API.post('/employees', employeeData);
  },

  // Update employee
  update: async (id, employeeData) => {
    return await API.put(`/employees/${id}`, employeeData);
  },

  // Delete employee
  delete: async (id) => {
    return await API.delete(`/employees/${id}`);
  },

  // Search employees by registration number, NIC, or name
  search: async (query) => {
    return await API.get(`/employees/search?query=${encodeURIComponent(query)}`);
  },

  // Change employee status (Mark as Former / Terminate)
  changeStatus: async (id, status, description, actionDate) => {
    return await API.patch(`/employees/${id}/status`, { status, description, actionDate });
  },

  // Get former employees (RESIGNED/TERMINATED/RETIRED)
  getFormer: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/employees/former${queryString ? `?${queryString}` : ''}`);
  },
};

export default employeeService;

