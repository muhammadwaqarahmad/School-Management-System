import { REGEX } from './constants.js';

// Validate email
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return REGEX.EMAIL.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6; // Minimum 6 characters
};

// Validate required fields
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Validate student data
export const validateStudentData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.rollNo || data.rollNo.trim().length < 1) {
    errors.push('Roll number is required');
  }
  
  if (!data.class || data.class.trim().length < 1) {
    errors.push('Class is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate employee data
export const validateEmployeeData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.position || data.position.trim().length < 2) {
    errors.push('Position is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate fee/salary data
export const validatePaymentData = (data) => {
  const errors = [];
  
  if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
    errors.push('Amount must be a positive number');
  }
  
  if (!data.month || data.month.trim().length < 1) {
    errors.push('Month is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate user registration
export const validateUserRegistration = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!validateEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!data.role || !['ADMIN', 'ACCOUNTANT'].includes(data.role)) {
    errors.push('Role must be either ADMIN or ACCOUNTANT');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate user login
export const validateUserLogin = (data) => {
  const errors = [];
  
  if (!validateEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

