/**
 * AUTHENTICATION CONTEXT
 * ======================
 * Provides authentication state and methods to entire app
 * - Manages user login/logout
 * - Provides user data to all components
 * - Handles authentication checks
 * 
 * HOW IT CONNECTS TO BACKEND:
 * - Uses authService to call backend /auth endpoints
 * - Stores JWT token in localStorage
 * - Automatically includes token in all API requests via interceptor
 */

import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.data.user);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.data.user);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;

