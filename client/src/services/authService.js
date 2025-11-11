/**
 * AUTHENTICATION SERVICE
 * ======================
 * Handles all authentication-related API calls
 * - Login
 * - Register
 * - Get Profile
 * - Logout
 */

import API from './api';

const authService = {
  // Login user
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Register new user
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Get current user profile
  getProfile: async () => {
    return await API.get('/auth/profile');
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;

