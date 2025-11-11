import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, ROLES } from "../utils/constants.js";

const prisma = new PrismaClient();

// Get all users (SUPER_ADMIN only)
export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        registrationNo: true,
        name: true,
        fatherName: true,
        email: true,
        role: true,
        mobileNumber: true,
        permanentAddress: true,
        currentAddress: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID (SUPER_ADMIN only)
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        registrationNo: true,
        name: true,
        fatherName: true,
        email: true,
        role: true,
        mobileNumber: true,
        permanentAddress: true,
        currentAddress: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new user (SUPER_ADMIN only)
export const createUser = async (req, res, next) => {
  try {
    const { 
      registrationNo, 
      name, 
      fatherName, 
      email, 
      password, 
      role,
      mobileNumber,
      permanentAddress,
      currentAddress
    } = req.body;

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`,
      });
    }

    // Only SUPER_ADMIN can create other SUPER_ADMINs or ADMINs
    if ((role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only SUPER_ADMIN can create SUPER_ADMIN or ADMIN accounts. You can only create ACCOUNTANT accounts.',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Check if registration number already exists
    const existingRegNo = await prisma.user.findUnique({
      where: { registrationNo },
    });

    if (existingRegNo) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Registration number already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        registrationNo,
        name,
        fatherName,
        email,
        password: hashedPassword,
        role,
        mobileNumber,
        permanentAddress,
        currentAddress,
      },
      select: {
        id: true,
        registrationNo: true,
        name: true,
        fatherName: true,
        email: true,
        role: true,
        mobileNumber: true,
        permanentAddress: true,
        currentAddress: true,
        createdAt: true,
      },
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Update a user (SUPER_ADMIN only)
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      registrationNo, 
      name, 
      fatherName, 
      email, 
      role,
      mobileNumber,
      permanentAddress,
      currentAddress
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate role if provided
    if (role && !Object.values(ROLES).includes(role)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`,
      });
    }

    // Only SUPER_ADMIN can change roles to/from SUPER_ADMIN or ADMIN
    if (role && (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN role',
      });
    }

    // Prevent ADMINs from editing SUPER_ADMIN or ADMIN users
    if (req.user.role === ROLES.ADMIN && (existingUser.role === ROLES.SUPER_ADMIN || existingUser.role === ROLES.ADMIN)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only edit ACCOUNTANT accounts',
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(registrationNo && { registrationNo }),
        ...(name && { name }),
        ...(fatherName && { fatherName }),
        ...(email && { email }),
        ...(role && { role }),
        ...(mobileNumber && { mobileNumber }),
        ...(permanentAddress && { permanentAddress }),
        ...(currentAddress && { currentAddress }),
      },
      select: {
        id: true,
        registrationNo: true,
        name: true,
        fatherName: true,
        email: true,
        role: true,
        mobileNumber: true,
        permanentAddress: true,
        currentAddress: true,
        createdAt: true,
      },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user (SUPER_ADMIN only)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (existingUser.id === req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Prevent ADMINs from deleting SUPER_ADMIN or ADMIN users
    if (req.user.role === ROLES.ADMIN && (existingUser.role === ROLES.SUPER_ADMIN || existingUser.role === ROLES.ADMIN)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only delete ACCOUNTANT accounts',
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DELETED,
    });
  } catch (error) {
    next(error);
  }
};

// Reset user password (SUPER_ADMIN only)
export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent ADMINs from resetting passwords for SUPER_ADMIN or ADMIN users
    if (req.user.role === ROLES.ADMIN && (existingUser.role === ROLES.SUPER_ADMIN || existingUser.role === ROLES.ADMIN)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only reset passwords for ACCOUNTANT accounts',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

