import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendSuccess, sendError, sendNotFound } from "../utils/responseHelpers.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

/**
 * PROFILE CONTROLLER
 * ==================
 * Manage user profile information
 * Accessible to authenticated users
 */

// Get current user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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
      createdAt: true
    }
  });

  if (!user) {
    return sendNotFound(res, 'User');
  }

  sendSuccess(res, { user }, null);
});

// Update current user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, fatherName, mobileNumber, permanentAddress, currentAddress } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name,
      fatherName,
      mobileNumber,
      permanentAddress,
      currentAddress
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
      createdAt: true
    }
  });

  sendSuccess(res, { user: updatedUser }, 'Profile updated successfully');
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    return sendNotFound(res, 'User');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return sendError(res, 'Current password is incorrect', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });

  sendSuccess(res, null, 'Password changed successfully');
});

