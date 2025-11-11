import { ROLES, HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

// Check if user has required role(s)
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
};

// Super Admin only access (can manage all users including admins)
export const superAdminOnly = requireRole(ROLES.SUPER_ADMIN);

// Admin and Super Admin access (can perform admin tasks)
export const adminOnly = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);

// Admin or Accountant access (includes Super Admin)
export const adminOrAccountant = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT);

// All roles access
export const allRoles = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT);

