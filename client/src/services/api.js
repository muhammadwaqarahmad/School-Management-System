/**
 * API SERVICE LAYER
 * ==================
 * This file creates an Axios instance configured to communicate with our backend.
 * It handles:
 * - Base URL configuration
 * - Automatic token attachment to requests
 * - Response/Error interceptors
 * - Token refresh logic
 */

import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend server URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically adds JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles errors globally
API.interceptors.response.use(
  (response) => response.data, // Return only data portion
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized (token expired/invalid)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Return error message from backend
      return Promise.reject(error.response.data);
    }
    
    // Network error
    return Promise.reject({
      success: false,
      message: 'Network error. Please check your connection.',
    });
  }
);

export default API;

