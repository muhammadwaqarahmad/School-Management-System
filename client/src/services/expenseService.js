import API from './api';

const expenseService = {
  // Get all expenses
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/expenses${queryString ? `?${queryString}` : ''}`);
  },

  // Get single expense by ID
  getById: async (id) => {
    return await API.get(`/expenses/${id}`);
  },

  // Get expense statistics
  getStats: async (month = null) => {
    const params = month ? `?month=${month}` : '';
    return await API.get(`/expenses/stats${params}`);
  },

  // Create new expense
  create: async (expenseData) => {
    return await API.post('/expenses', expenseData);
  },

  // Update expense
  update: async (id, expenseData) => {
    return await API.put(`/expenses/${id}`, expenseData);
  },

  // Mark expense as paid
  markAsPaid: async (id) => {
    return await API.patch(`/expenses/${id}/pay`);
  },

  // Delete expense
  delete: async (id) => {
    return await API.delete(`/expenses/${id}`);
  },

  // Generate monthly fees and salaries
  generateMonthly: async (month) => {
    return await API.post('/reports/generate-monthly', { month });
  },

  // Auto-generate check
  autoGenerate: async () => {
    return await API.get('/reports/auto-generate');
  }
};

export default expenseService;

