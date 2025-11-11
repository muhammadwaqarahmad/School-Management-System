/**
 * LOGGER CONFIGURATION
 * ====================
 * Centralized logging utility using console with structured format
 * In production, consider using winston, pino, or similar
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info: (message, meta = {}) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, Object.keys(meta).length > 0 ? meta : '');
    }
  },

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata (error object, stack, etc.)
   */
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, Object.keys(meta).length > 0 ? meta : '');
  },

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, Object.keys(meta).length > 0 ? meta : '');
  },

  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug: (message, meta = {}) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, Object.keys(meta).length > 0 ? meta : '');
    }
  }
};

export default logger;

