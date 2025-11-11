import { PrismaClient } from "@prisma/client";
import { validateEmployeeData } from "../utils/validators.js";
import { generateSalaryForEmployee } from "../services/monthlyGenerationService.js";
import { sendSuccess, sendError, sendNotFound, sendValidationError, sendCreated } from "../utils/responseHelpers.js";
import { buildWhereClause, filterByStatus, addLeavingDate, buildSearchCondition, parseInteger } from "../utils/dbHelpers.js";
import { parseLocalDate } from "../utils/dateHelpers.js";
import logger from "../config/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

// Get all employees (defaults to ACTIVE only)
export const getEmployees = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const where = buildWhereClause({ status });
  
  const employees = await prisma.employee.findMany({
    where,
    include: { 
      salaries: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Filter by ACTIVE status client-side if no status filter was provided
  const filteredEmployees = status ? employees : filterByStatus(employees, null);
  
  sendSuccess(res, { employees: filteredEmployees, count: filteredEmployees.length });
});

// Get former employees (RESIGNED, TERMINATED, or RETIRED)
export const getFormerEmployees = asyncHandler(async (req, res) => {
  const { searchQuery, status } = req.query;
  
  const searchCondition = buildSearchCondition(
    ['registrationNo', 'name', 'nic'],
    searchQuery
  );
  
  const where = searchCondition || {};
  
  const allEmployees = await prisma.employee.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      salaries: {
        orderBy: { createdAt: 'desc' }
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Filter by status client-side and add leaving date
  let formerEmployees = allEmployees;
  try {
    if (status && ['RESIGNED', 'TERMINATED', 'RETIRED'].includes(status)) {
      formerEmployees = allEmployees.filter(e => e.status === status);
    } else {
      // Default: filter for RESIGNED, TERMINATED, or RETIRED
      formerEmployees = allEmployees.filter(e => 
        e.status === 'RESIGNED' || e.status === 'TERMINATED' || e.status === 'RETIRED'
      );
    }
    
    // Add leaving date from status log
    formerEmployees = formerEmployees.map(employee => addLeavingDate(employee));
  } catch (filterError) {
    // If status field doesn't exist, return empty array
    logger.warn('Status filtering failed', { error: filterError.message });
    formerEmployees = [];
  }
  
  sendSuccess(res, { employees: formerEmployees, count: formerEmployees.length });
});

// Get single employee
export const getEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = parseInteger(id);
  
  if (!employeeId) {
    return sendError(res, 'Invalid employee ID', 400);
  }
  
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { 
      salaries: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  if (!employee) {
    return sendNotFound(res, 'Employee');
  }
  
  // Add leaving date from status log
  const employeeWithLeavingDate = addLeavingDate(employee);
  
  sendSuccess(res, { employee: employeeWithLeavingDate });
});

// Create new employee
export const createEmployee = asyncHandler(async (req, res) => {
  const employeeData = req.body;

  // Remove fields that don't exist in the Employee model
  const { positionType, customPosition, ...validEmployeeData } = employeeData;

  // Normalize and validate types coming from the client
  if (validEmployeeData.joiningDate) {
    const parsedDate = new Date(validEmployeeData.joiningDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return sendError(res, 'Invalid joiningDate. Provide a valid ISO-8601 date string.', 400);
    }
    validEmployeeData.joiningDate = parsedDate;
  }

  if (validEmployeeData.salary !== undefined) {
    const numericSalary = typeof validEmployeeData.salary === 'number' ? validEmployeeData.salary : Number(validEmployeeData.salary);
    if (!Number.isFinite(numericSalary)) {
      return sendError(res, 'Invalid salary. Provide a numeric value.', 400);
    }
    validEmployeeData.salary = numericSalary;
  }

  if (validEmployeeData.dateOfBirth) {
    const parsedDate = new Date(validEmployeeData.dateOfBirth);
    if (Number.isNaN(parsedDate.getTime())) {
      return sendError(res, 'Invalid dateOfBirth. Provide a valid ISO-8601 date string.', 400);
    }
    validEmployeeData.dateOfBirth = parsedDate;
  } else if (validEmployeeData.dateOfBirth === '' || validEmployeeData.dateOfBirth === null) {
    validEmployeeData.dateOfBirth = null;
  }

  // Handle optional fields
  if (validEmployeeData.gender === '' || validEmployeeData.gender === null) {
    validEmployeeData.gender = null;
  }
  if (validEmployeeData.nic === '' || validEmployeeData.nic === null) {
    validEmployeeData.nic = null;
  }
  if (validEmployeeData.religion === '' || validEmployeeData.religion === null) {
    validEmployeeData.religion = null;
  }
  
  const employee = await prisma.employee.create({
    data: validEmployeeData
  });

  // Automatically generate salary for current month
  const userId = req.user?.id || null;
  try {
    await generateSalaryForEmployee(employee.id, undefined, userId);
  } catch (salaryError) {
    logger.error('Failed to generate salary for new employee', { error: salaryError });
    // Don't fail employee creation if salary generation fails
  }
  
  sendCreated(res, { employee });
});

// Update employee
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeData = req.body;
  const employeeId = parseInteger(id);
  
  if (!employeeId) {
    return sendError(res, 'Invalid employee ID', 400);
  }

  // Remove fields that don't exist in the Employee model
  const { positionType, customPosition, ...validEmployeeData } = employeeData;

  // Normalize optional fields if provided
  if (validEmployeeData.joiningDate !== undefined) {
    const parsedDate = new Date(validEmployeeData.joiningDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return sendError(res, 'Invalid joiningDate. Provide a valid ISO-8601 date string.', 400);
    }
    validEmployeeData.joiningDate = parsedDate;
  }

  if (validEmployeeData.salary !== undefined) {
    const numericSalary = typeof validEmployeeData.salary === 'number' ? validEmployeeData.salary : Number(validEmployeeData.salary);
    if (!Number.isFinite(numericSalary)) {
      return sendError(res, 'Invalid salary. Provide a numeric value.', 400);
    }
    validEmployeeData.salary = numericSalary;
  }

  if (validEmployeeData.dateOfBirth !== undefined) {
    if (validEmployeeData.dateOfBirth === null || validEmployeeData.dateOfBirth === '') {
      validEmployeeData.dateOfBirth = null;
    } else {
      const parsedDate = new Date(validEmployeeData.dateOfBirth);
      if (Number.isNaN(parsedDate.getTime())) {
        return sendError(res, 'Invalid dateOfBirth. Provide a valid ISO-8601 date string.', 400);
      }
      validEmployeeData.dateOfBirth = parsedDate;
    }
  }

  // Handle optional fields
  if (validEmployeeData.gender !== undefined) {
    if (validEmployeeData.gender === '' || validEmployeeData.gender === null) {
      validEmployeeData.gender = null;
    }
  }
  if (validEmployeeData.nic !== undefined) {
    if (validEmployeeData.nic === '' || validEmployeeData.nic === null) {
      validEmployeeData.nic = null;
    }
  }
  if (validEmployeeData.religion !== undefined) {
    if (validEmployeeData.religion === '' || validEmployeeData.religion === null) {
      validEmployeeData.religion = null;
    }
  }
  
  try {
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: validEmployeeData
    });
    
    sendSuccess(res, { employee }, 'Employee updated successfully');
  } catch (error) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Employee');
    }
    throw error;
  }
});

// Search employees by registration number, NIC, or name
export const searchEmployees = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim().length === 0) {
    return sendError(res, 'Search query is required', 400);
  }

  const searchTerm = query.trim();
  const searchCondition = buildSearchCondition(
    ['registrationNo', 'name', 'nic'],
    searchTerm
  );
  
  // Search in multiple fields using OR condition
  const employees = await prisma.employee.findMany({
    where: searchCondition,
    include: {
      salaries: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  sendSuccess(res, { 
    employees, 
    count: employees.length 
  });
});

// Delete employee
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = parseInteger(id);
  
  if (!employeeId) {
    return sendError(res, 'Invalid employee ID', 400);
  }
  
  // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });
  
  if (!employee) {
    return sendNotFound(res, 'Employee');
  }
  
  // Delete all associated salaries first
  try {
    await prisma.salary.deleteMany({
      where: { employeeId: employeeId }
    });
  } catch (salaryError) {
    logger.warn('Could not delete salaries', { error: salaryError.message });
  }
  
  // Delete all associated status logs
  try {
    await prisma.employeeStatusLog.deleteMany({
      where: { employeeId: employeeId }
    });
  } catch (logError) {
    logger.warn('Could not delete status logs', { error: logError.message });
  }
  
  // Now delete the employee
  await prisma.employee.delete({
    where: { id: employeeId }
  });
  
  sendSuccess(res, null, 'Employee deleted successfully');
});

// Change employee status (Mark as Former / Terminate)
export const changeEmployeeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, description, actionDate } = req.body;
  const userId = req.user?.id;
  const employeeId = parseInteger(id);
  
  if (!employeeId) {
    return sendError(res, 'Invalid employee ID', 400);
  }

  if (!status || !['RESIGNED', 'TERMINATED', 'RETIRED', 'ACTIVE'].includes(status)) {
    return sendError(res, 'Invalid status. Must be RESIGNED, TERMINATED, RETIRED, or ACTIVE', 400);
  }

  // Get current employee
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });

  if (!employee) {
    return sendNotFound(res, 'Employee');
  }

  const oldStatus = employee.status;

  // Parse action date if provided
  let parsedActionDate = null;
  if (actionDate) {
    parsedActionDate = parseLocalDate(actionDate);
    if (!parsedActionDate) {
      return sendError(res, 'Invalid action date format. Expected YYYY-MM-DD', 400);
    }
  }

  // Update employee status
  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: { status }
  });

  // Log the status change
  try {
    await prisma.employeeStatusLog.create({
      data: {
        employeeId: employeeId,
        oldStatus,
        newStatus: status,
        description: description || null,
        actionDate: parsedActionDate || null,
        changedBy: userId || null
      }
    });
  } catch (logError) {
    logger.warn('Status log creation failed', { error: logError.message, employeeId });
    // Continue without logging if table doesn't exist
  }

  sendSuccess(res, { employee: updatedEmployee }, `Employee status updated to ${status}`);
});
