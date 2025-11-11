/**
 * RESPONSE HELPERS
 * ================
 * Standardized API response utilities for consistent response format
 */

import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from './constants.js';

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data (always wrapped in data property for consistency)
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data = null, message = null, statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    ...(message && { message }),
    ...(data !== null && { data })
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} errors - Additional error details
 */
export const sendError = (res, message = ERROR_MESSAGES.SERVER_ERROR, statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Send created response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
export const sendCreated = (res, data, message = SUCCESS_MESSAGES.CREATED) => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name (e.g., 'Student', 'Employee')
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendUnauthorized = (res, message = ERROR_MESSAGES.UNAUTHORIZED) => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendForbidden = (res, message = ERROR_MESSAGES.FORBIDDEN) => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {*} errors - Validation errors
 * @param {string} message - Error message
 */
export const sendValidationError = (res, errors, message = ERROR_MESSAGES.VALIDATION_ERROR) => {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST, errors);
};

