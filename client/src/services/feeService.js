/**
 * FEE SERVICE
 * ===========
 * Handles all fee-related API calls including payment tracking
 */

import API from './api';

const feeService = {
  // Get all fees (with optional filters)
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/fees${queryString ? `?${queryString}` : ''}`);
  },

  // Get single fee by ID
  getById: async (id) => {
    return await API.get(`/fees/${id}`);
  },

  // Create new fee
  create: async (feeData) => {
    return await API.post('/fees', feeData);
  },

  // Update fee
  update: async (id, feeData) => {
    return await API.put(`/fees/${id}`, feeData);
  },

  // Mark fee as paid
  markAsPaid: async (id) => {
    return await API.patch(`/fees/${id}/pay`);
  },

  // Delete fee
  delete: async (id) => {
    return await API.delete(`/fees/${id}`);
  },

  // Get current user's past fees
  getMyFees: async () => {
    return await API.get('/fees/my-fees');
  },
};

export default feeService;

