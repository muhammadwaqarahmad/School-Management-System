import { PrismaClient } from "@prisma/client";
import { validateStudentData } from "../utils/validators.js";
import { generateFeeForStudent } from "../services/monthlyGenerationService.js";
import { sendSuccess, sendError, sendNotFound, sendValidationError, sendCreated } from "../utils/responseHelpers.js";
import { buildWhereClause, filterByStatus, addLeavingDate, buildSearchCondition, parseInteger } from "../utils/dbHelpers.js";
import { parseLocalDate, getCurrentMonthYear } from "../utils/dateHelpers.js";
import logger from "../config/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

// Get all students (with optional status filter)
export const getStudents = asyncHandler(async (req, res) => {
  const where = buildWhereClause({
    classId: req.query.classId,
    class: req.query.class,
    sectionId: req.query.sectionId,
    section: req.query.section,
    status: req.query.status
  });
  
  const students = await prisma.student.findMany({
    where,
    include: {
      classRelation: true,
      sectionRelation: true,
      fees: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Filter by ACTIVE status if no status filter was provided
  const filteredStudents = req.query.status 
    ? students 
    : filterByStatus(students, null);
  
  sendSuccess(res, { 
    students: filteredStudents, 
    count: filteredStudents.length 
  });
});

// Get alumni (students with GRADUATED or DROPPED status)
export const getAlumni = asyncHandler(async (req, res) => {
  const { searchQuery, status } = req.query;
  
  const searchCondition = buildSearchCondition(
    ['registrationNo', 'rollNo', 'name', 'nic'],
    searchQuery
  );
  
  const where = searchCondition || undefined;
  
  const allStudents = await prisma.student.findMany({
    where,
    include: {
      classRelation: true,
      sectionRelation: true,
      fees: {
        orderBy: { createdAt: 'desc' }
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Filter by GRADUATED or DROPPED status
  let alumni = allStudents.filter(s => 
    s.status === 'GRADUATED' || s.status === 'DROPPED'
  );
  
  // Apply specific status filter if provided
  if (status && (status === 'GRADUATED' || status === 'DROPPED')) {
    alumni = alumni.filter(s => s.status === status);
  }
  
  // Add leaving date from status log
  alumni = alumni.map(addLeavingDate);
  
  sendSuccess(res, { alumni, count: alumni.length });
});

// Get single student
export const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = parseInt(id, 10);
  
  if (isNaN(studentId)) {
    return sendError(res, 'Invalid student ID', 400);
  }
  
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      classRelation: true,
      sectionRelation: true,
      fees: {
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
      promotions: {
        orderBy: { createdAt: 'asc' }
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  if (!student) {
    return sendNotFound(res, 'Student');
  }
  
  const studentWithLeavingDate = addLeavingDate(student);
  
  sendSuccess(res, { student: studentWithLeavingDate });
});

// Create new student
export const createStudent = async (req, res, next) => {
  try {
    const { name, rollNo, class: className, section, classId, sectionId } = req.body;
    
    // Validate input
    const validation = validateStudentData({ name, rollNo, class: className || req.body.class });
    if (!validation.isValid) {
      return sendValidationError(res, validation.errors);
    }

    // If classId is provided, verify it exists and get class name
    let finalClassId = null;
    let finalClassName = className;
    if (classId) {
      const classIdParsed = parseInteger(classId);
      if (!classIdParsed) {
        return sendError(res, 'Invalid class ID', 400);
      }
      const classRecord = await prisma.class.findUnique({
        where: { id: classIdParsed }
      });
      if (!classRecord) {
        return sendNotFound(res, 'Class');
      }
      finalClassId = classIdParsed;
      finalClassName = classRecord.name;
    }

    // If sectionId is provided, verify it exists and belongs to the class
    let finalSectionId = null;
    let finalSection = section;
    if (sectionId) {
      const sectionIdParsed = parseInteger(sectionId);
      if (!sectionIdParsed) {
        return sendError(res, 'Invalid section ID', 400);
      }
      const sectionRecord = await prisma.section.findUnique({
        where: { id: sectionIdParsed },
        include: { class: true }
      });
      if (!sectionRecord) {
        return sendNotFound(res, 'Section');
      }
      if (finalClassId && sectionRecord.classId !== finalClassId) {
        return sendError(res, 'Section does not belong to the selected class', 400);
      }
      finalSectionId = sectionIdParsed;
      finalSection = sectionRecord.name;
      // Ensure classId matches section's class
      if (!finalClassId) {
        finalClassId = sectionRecord.classId;
        const classRecord = await prisma.class.findUnique({
          where: { id: finalClassId }
        });
        finalClassName = classRecord.name;
      }
    }
    
    // Determine session: prefer provided, else current configured for program
    let finalSession = req.body.session;
    if (!finalSession && req.body.program) {
      const currentSession = await prisma.programSession.findFirst({ where: { program: req.body.program, isCurrent: true } });
      if (currentSession) {
        finalSession = currentSession.session;
      } else {
        const currentYear = new Date().getFullYear();
        finalSession = `${currentYear}-${currentYear + 1}`;
      }
    }

    const student = await prisma.student.create({
      data: { 
        name,
        rollNo,
        class: finalClassName,
        section: finalSection,
        classId: finalClassId,
        sectionId: finalSectionId,
        registrationNo: req.body.registrationNo,
        fatherName: req.body.fatherName,
        program: req.body.program,
        session: finalSession,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        currentAddress: req.body.currentAddress,
        permanentAddress: req.body.permanentAddress,
        nic: req.body.nic || null,
        gender: req.body.gender || null,
        religion: req.body.religion || null,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
        joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : null
      },
      include: {
        classRelation: true,
        sectionRelation: true
      }
    });

    // Automatically generate fee for current month
    try {
      await generateFeeForStudent(student.id);
    } catch (feeError) {
      logger.error('Failed to generate fee for new student', { error: feeError });
      // Don't fail student creation if fee generation fails
    }
    
    sendCreated(res, { student }, 'Student created successfully');
  } catch (error) {
    next(error);
  }
};

// Update student
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = parseInteger(id);
  
  if (!studentId) {
    return sendError(res, 'Invalid student ID', 400);
  }
  
  const { name, rollNo, class: className, section, program, classId, sectionId } = req.body;
  
  // Log incoming request data
  logger.info('Update student request', { 
    studentId, 
    bodyFields: Object.keys(req.body),
    name, 
    rollNo, 
    classId, 
    sectionId,
    registrationNo: req.body.registrationNo
  });
  
  // Get current student data to check for promotion
  const currentStudent = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      classRelation: true,
      sectionRelation: true
    }
  });

  if (!currentStudent) {
    return sendNotFound(res, 'Student');
  }

  // Handle classId update
  let finalClassId = currentStudent.classId;
  let finalClassName = currentStudent.class;
  if ('classId' in req.body) {
    if (classId === null || classId === '') {
      finalClassId = null;
      finalClassName = null;
    } else {
      const classIdParsed = parseInteger(classId);
      if (!classIdParsed) {
        return sendError(res, 'Invalid class ID', 400);
      }
      const classRecord = await prisma.class.findUnique({
        where: { id: classIdParsed }
      });
      if (!classRecord) {
        return sendNotFound(res, 'Class');
      }
      finalClassId = classIdParsed;
      finalClassName = classRecord.name;
    }
  } else if (className && className !== currentStudent.class) {
    // Legacy: find class by name
    const classRecord = await prisma.class.findFirst({
      where: { name: className }
    });
    if (classRecord) {
      finalClassId = classRecord.id;
      finalClassName = className;
    }
  }

  // Handle sectionId update
  let finalSectionId = currentStudent.sectionId;
  let finalSection = currentStudent.section;
  if ('sectionId' in req.body) {
    if (sectionId === null || sectionId === '') {
      finalSectionId = null;
      finalSection = null;
    } else {
      const sectionIdParsed = parseInteger(sectionId);
      if (!sectionIdParsed) {
        return sendError(res, 'Invalid section ID', 400);
      }
      const sectionRecord = await prisma.section.findUnique({
        where: { id: sectionIdParsed },
        include: { class: true }
      });
      if (!sectionRecord) {
        return sendNotFound(res, 'Section');
      }
      // Verify section belongs to the class
      if (finalClassId && sectionRecord.classId !== finalClassId) {
        return sendError(res, 'Section does not belong to the selected class', 400);
      }
      finalSectionId = sectionIdParsed;
      finalSection = sectionRecord.name;
    }
  } else if (section !== undefined && section !== currentStudent.section) {
    finalSection = section;
    // Try to find section by name and classId
    if (finalClassId) {
      const sectionRecord = await prisma.section.findUnique({
        where: {
          classId_name: {
            classId: finalClassId,
            name: section
          }
        }
      });
      if (sectionRecord) {
        finalSectionId = sectionRecord.id;
      }
    }
  }

  const updateData = {};
  
  // Always update core fields if they exist in request body or have been processed
  if (name !== undefined) updateData.name = name;
  if (rollNo !== undefined) updateData.rollNo = rollNo;
  updateData.class = finalClassName;
  updateData.classId = finalClassId;
  updateData.section = finalSection;
  updateData.sectionId = finalSectionId;
  
  // Update other fields if provided in request body
  if ('registrationNo' in req.body) updateData.registrationNo = req.body.registrationNo || null;
  if ('fatherName' in req.body) updateData.fatherName = req.body.fatherName || null;
  if ('program' in req.body) updateData.program = req.body.program || null;
  if ('session' in req.body) updateData.session = req.body.session || null;
  if ('phoneNumber' in req.body) updateData.phoneNumber = req.body.phoneNumber || null;
  if ('email' in req.body) updateData.email = req.body.email || null;
  if ('currentAddress' in req.body) updateData.currentAddress = req.body.currentAddress || null;
  if ('permanentAddress' in req.body) updateData.permanentAddress = req.body.permanentAddress || null;
  if ('nic' in req.body) updateData.nic = req.body.nic || null;
  if ('gender' in req.body) updateData.gender = req.body.gender || null;
  if ('religion' in req.body) updateData.religion = req.body.religion || null;
  if ('dateOfBirth' in req.body) {
    updateData.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
  }
  if ('joiningDate' in req.body) {
    updateData.joiningDate = req.body.joiningDate ? new Date(req.body.joiningDate) : null;
  }
  
  // Log update data for debugging
  logger.info('Update data prepared', { studentId, updateDataKeys: Object.keys(updateData), updateData });
  
  // Ensure we have at least one field to update
  if (Object.keys(updateData).length === 0) {
    logger.warn('No fields to update', { studentId, reqBody: req.body });
    return sendError(res, 'No fields provided for update', 400);
  }
  
  const student = await prisma.student.update({
    where: { id: studentId },
    data: updateData,
    include: {
      classRelation: true,
      sectionRelation: true
    }
  });

  // If class or program changed (promotion), update unpaid fees and generate fee for current month
  const isPromotion = (className && className !== currentStudent.class) || 
                      (program && program !== currentStudent.program);
  
  if (isPromotion) {
    try {
      // Get the new program fee if program changed
      let newProgramFee = null;
      if (program && program !== currentStudent.program) {
        newProgramFee = await prisma.programFee.findUnique({
          where: { program: program }
        });
      } else if (updateData.classId) {
        // If class changed, get program from new class
        const newClassRecord = await prisma.class.findUnique({
          where: { id: updateData.classId }
        });
        if (newClassRecord && newClassRecord.program) {
          newProgramFee = await prisma.programFee.findUnique({
            where: { program: newClassRecord.program }
          });
        }
      }

      // Update unpaid fees to use new program's fee amount if program/class changed
      // ONLY update unpaid fees for current month or future months (not past months)
      if (newProgramFee) {
        const currentMonth = getCurrentMonthYear();
        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"];
        
        // Get all unpaid fees for this student
        const unpaidFees = await prisma.fee.findMany({
          where: {
            studentId: student.id,
            paid: false
          }
        });

        // Filter to only current and future months
        const currentDate = new Date();
        const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        let updatedCount = 0;
        for (const fee of unpaidFees) {
          const [monthName, year] = fee.month.split(' ');
          const monthIndex = monthNames.indexOf(monthName);
          if (monthIndex === -1) continue;
          
          const feeDate = new Date(parseInt(year), monthIndex, 1);
          
          // Only update fees for current month or future months
          if (feeDate >= currentMonthDate) {
            await prisma.fee.update({
              where: { id: fee.id },
              data: {
                amount: newProgramFee.feeAmount
                // Don't update historical data - it should remain as it was when fee was created
              }
            });
            updatedCount++;
          }
        }
        
        if (updatedCount > 0) {
          logger.info(`Updated ${updatedCount} unpaid fee(s) for current/future months for ${student.name} to new program fee amount: ${newProgramFee.feeAmount}`);
        }
      }

      // Generate fee for current month
      await generateFeeForStudent(student.id);
      logger.info(`Generated fee for promoted student: ${student.name}`);
    } catch (feeError) {
      logger.error('Failed to update fees for promoted student', { error: feeError, studentId: student.id });
      // Don't fail student update if fee generation fails
    }
  }
  
  sendSuccess(res, { student }, 'Student updated successfully');
});

// Search students by registration number, roll number, name, or NIC
export const searchStudents = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim().length === 0) {
    return sendError(res, 'Search query is required', 400);
  }

  const searchTerm = query.trim();
  
  // Search in multiple fields using OR condition
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { registrationNo: { contains: searchTerm, mode: 'insensitive' } },
        { rollNo: { contains: searchTerm, mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { nic: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    include: {
      classRelation: true,
      sectionRelation: true,
      fees: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate fee status for each student
  const studentsWithFeeStatus = students.map(student => {
    const totalFees = student.fees.length;
    const paidFees = student.fees.filter(f => f.paid).length;
    const unpaidFees = totalFees - paidFees;
    const totalAmount = student.fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = student.fees.filter(f => f.paid).reduce((sum, fee) => sum + fee.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    // Calculate overdue fees
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    const overdueFees = student.fees.filter(fee => {
      if (fee.paid) return false;
      const [monthName, year] = fee.month.split(' ');
      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex === -1) return false;
      const feeDate = new Date(parseInt(year), monthIndex, 1);
      return feeDate < currentMonth;
    });
    
    const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.amount, 0);

    return {
      ...student,
      feeStatus: {
        total: totalFees,
        paid: paidFees,
        unpaid: unpaidFees,
        overdue: overdueFees.length,
        totalAmount,
        paidAmount,
        unpaidAmount,
        overdueAmount,
        fees: student.fees
      }
    };
  });
  
  sendSuccess(res, { 
    students: studentsWithFeeStatus, 
    count: studentsWithFeeStatus.length 
  });
});

// Delete student
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Log the received ID for debugging
  logger.info('Delete student request', { id, type: typeof id });
  
  const studentId = parseInteger(id);
  
  if (!studentId) {
    logger.warn('Invalid student ID provided', { id, parsed: studentId });
    return sendError(res, `Invalid student ID: ${id}`, 400);
  }
  
  logger.info('Parsed student ID', { studentId, originalId: id });
  
  // Check if student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });
  
  if (!student) {
    logger.warn('Student not found for deletion', { studentId, originalId: id });
    return sendNotFound(res, 'Student');
  }
  
  // Delete all associated fees first
  try {
    await prisma.fee.deleteMany({
      where: { studentId: studentId }
    });
  } catch (feeError) {
    logger.warn('Could not delete fees', { error: feeError.message, studentId });
  }
  
  // Delete all associated promotion records
  try {
    await prisma.studentPromotion.deleteMany({
      where: { studentId: studentId }
    });
  } catch (promotionError) {
    logger.warn('Could not delete promotions', { error: promotionError.message, studentId });
  }
  
  // Delete all associated status logs
  try {
    await prisma.studentStatusLog.deleteMany({
      where: { studentId: studentId }
    });
  } catch (logError) {
    logger.warn('Could not delete status logs', { error: logError.message, studentId });
  }
  
  // Now delete the student
  await prisma.student.delete({
    where: { id: studentId }
  });
  
  sendSuccess(res, null, 'Student deleted successfully');
});

// Change student status (Promote to Alumni / Mark as Dropped)
export const changeStudentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = parseInteger(id);
  const { status, description, actionDate } = req.body;
  const userId = req.user?.id;

  if (!studentId) {
    return sendError(res, 'Invalid student ID', 400);
  }

  if (!status || !['GRADUATED', 'DROPPED', 'ACTIVE'].includes(status)) {
    return sendError(res, 'Invalid status. Must be GRADUATED, DROPPED, or ACTIVE', 400);
  }

  // Get current student
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    return sendNotFound(res, 'Student');
  }

  const oldStatus = student.status;

  // Parse action date if provided
  const parsedActionDate = actionDate ? parseLocalDate(actionDate) : null;
  if (actionDate && !parsedActionDate) {
    return sendError(res, 'Invalid action date format. Expected YYYY-MM-DD', 400);
  }

  // Update student status
  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: { status }
  });

  // Log the status change
  try {
    await prisma.studentStatusLog.create({
      data: {
        studentId: studentId,
        oldStatus,
        newStatus: status,
        description: description || null,
        actionDate: parsedActionDate || null,
        changedBy: userId || null
      }
    });
  } catch (logError) {
    logger.warn('Status log creation failed', { error: logError.message, studentId });
    // Continue without logging if table doesn't exist
  }

  sendSuccess(res, { student: updatedStudent }, `Student status updated to ${status}`);
});
