/**
 * ERROR HANDLING UTILITIES
 * ========================
 * Standardized error handling and user feedback
 */

/**
 * Extract error message from error object
 * @param {Error|Object} error - Error object from API or exception
 * @param {string} defaultMessage - Default message if error message cannot be extracted
 * @returns {string} Error message to display to user
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred. Please try again.') => {
  if (!error) return defaultMessage;
  
  // Handle API response errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Handle error object with message property
  if (error.message) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  return defaultMessage;
};

/**
 * Show error alert with consistent formatting
 * @param {Error|Object|string} error - Error to display
 * @param {string} defaultMessage - Default message if error cannot be parsed
 */
export const showError = (error, defaultMessage = 'An error occurred. Please try again.') => {
  const message = getErrorMessage(error, defaultMessage);
  alert(message);
};

/**
 * Show success alert
 * @param {string} message - Success message to display
 */
export const showSuccess = (message) => {
  alert(message);
};

/**
 * Handle async error with logging and user feedback
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred (for logging)
 * @param {string} userMessage - Message to show to user
 */
export const handleError = (error, context, userMessage = null) => {
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error in ${context}:`, error);
  }
  
  // Show user-friendly message
  const message = userMessage || getErrorMessage(error);
  showError(message);
};

