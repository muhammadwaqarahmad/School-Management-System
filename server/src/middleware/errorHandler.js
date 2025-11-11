import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import logger from '../config/logger.js';

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Log error with context
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ...(err.code && { code: err.code })
  });
  
  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'A record with this unique field already exists',
      error: err.meta?.target || 'Unique constraint violation'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Record not found',
      error: err.meta?.cause || 'The requested record does not exist'
    });
  }
  
  if (err.code && err.code.startsWith('P')) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Database error',
      error: err.message
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
      error: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
      error: 'Token has expired'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      errors: err.errors || err.message
    });
  }
  
  // Default error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_MESSAGES.SERVER_ERROR;
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Not found handler
export const notFoundHandler = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

