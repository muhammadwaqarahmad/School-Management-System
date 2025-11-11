/**
 * SALARY SERVICE
 * ==============
 * Handles all salary-related API calls including payment tracking
 */

import API from './api';

const salaryService = {
  // Get all salaries (with optional filters)
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/salaries${queryString ? `?${queryString}` : ''}`);
  },

  // Get single salary by ID
  getById: async (id) => {
    return await API.get(`/salaries/${id}`);
  },

  // Create new salary
  create: async (salaryData) => {
    return await API.post('/salaries', salaryData);
  },

  // Update salary
  update: async (id, salaryData) => {
    return await API.put(`/salaries/${id}`, salaryData);
  },

  // Mark salary as paid
  markAsPaid: async (id) => {
    return await API.patch(`/salaries/${id}/pay`);
  },

  // Delete salary
  delete: async (id) => {
    return await API.delete(`/salaries/${id}`);
  },
};

export default salaryService;

