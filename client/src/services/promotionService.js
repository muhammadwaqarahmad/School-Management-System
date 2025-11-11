/**
 * PROMOTION SERVICE
 * =================
 * Handles all student promotion-related API calls
 */

import API from './api';

const promotionService = {
  // Promote students
  promote: async (promotionData) => {
    return await API.post('/promotions/promote', promotionData);
  },

  // Get promotion history
  getHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await API.get(`/promotions/history${queryString ? `?${queryString}` : ''}`);
  },

  // Get classes for promotion dropdown
  getClasses: async () => {
    return await API.get('/promotions/classes');
  },
};

export default promotionService;

