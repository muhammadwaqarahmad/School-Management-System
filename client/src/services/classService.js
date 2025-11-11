/**
 * CLASS SERVICE
 * =============
 * Handles all class-related API calls
 */

import API from './api';

const classService = {
  // Get all classes
  getAll: async () => {
    return await API.get('/classes');
  },

  // Get single class by ID
  getById: async (id) => {
    return await API.get(`/classes/${id}`);
  },

  // Create new class
  create: async (classData) => {
    return await API.post('/classes', classData);
  },

  // Update class
  update: async (id, classData) => {
    return await API.put(`/classes/${id}`, classData);
  },

  // Delete class
  delete: async (id) => {
    return await API.delete(`/classes/${id}`);
  },
};

export default classService;

