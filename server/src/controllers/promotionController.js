import { PrismaClient } from "@prisma/client";
import { generateFeeForStudent } from "../services/monthlyGenerationService.js";
import { sendSuccess, sendError, sendNotFound } from "../utils/responseHelpers.js";
import { parseInteger } from "../utils/dbHelpers.js";
import logger from "../config/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

// Generate next session automatically
const getNextSession = () => {
  const currentYear = new Date().getFullYear();
  return `${currentYear + 1}-${currentYear + 2}`;
};

// Promote students
export const promoteStudents = asyncHandler(async (req, res) => {
  const { 
    currentClass, 
    nextClass, 
    session, 
    studentIds, 
    promotionType, // "ALL" or "SELECTED"
    action, // "PROMOTE" or "REPEAT"
    sourceSectionIds, // Array of section IDs to promote FROM
    targetSectionId // Section ID to promote TO
  } = req.body;
  
  const userId = req.user.id;
  let requestSession = session || null;

  if (!currentClass) {
    return sendError(res, 'Current class is required', 400);
  }

  if (action !== 'REPEAT' && !nextClass) {
    return sendError(res, 'Next class is required for promotion', 400);
  }

    // Get current and next class records
    const currentClassRecord = await prisma.class.findFirst({
      where: { name: currentClass }
    });

    if (!currentClassRecord) {
      return sendNotFound(res, 'Current class');
    }

    let nextClassRecord = null;
    if (nextClass) {
      nextClassRecord = await prisma.class.findFirst({
        where: { name: nextClass }
      });

      if (!nextClassRecord) {
        return sendNotFound(res, 'Next class');
      }
    }

    // Build where clause for students
    const studentWhere = {
      classId: currentClassRecord.id,
      status: 'ACTIVE'
    };
    
    // Filter by source sections if provided
    if (sourceSectionIds && Array.isArray(sourceSectionIds) && sourceSectionIds.length > 0) {
      const parsedSectionIds = sourceSectionIds.map(id => parseInteger(id)).filter(id => id !== null);
      if (parsedSectionIds.length > 0) {
        studentWhere.sectionId = { in: parsedSectionIds };
      }
    }
    
    // Get students to promote
    let students;
    if (promotionType === 'ALL') {
      students = await prisma.student.findMany({
        where: studentWhere,
        include: {
          sectionRelation: true
        }
      });
    } else {
      if (!studentIds || studentIds.length === 0) {
        return sendError(res, 'Please select at least one student', 400);
      }
      students = await prisma.student.findMany({
        where: {
          ...studentWhere,
          id: { in: studentIds.map(id => parseInt(id)) }
        },
        include: {
          sectionRelation: true
        }
      });
    }

    if (students.length === 0) {
      return sendError(res, 'No active students found to promote', 400);
    }

    const promotedStudents = [];
    const errors = [];

    for (const student of students) {
      try {
        const oldClass = student.class;
        const oldSession = student.session;
        const oldSection = student.sectionRelation?.name || student.section;
        
        let newClassRecord, newClassValue, newSessionValue, newSectionId, newSectionName;

        if (action === 'REPEAT') {
          // Repeat in same class
          newClassRecord = currentClassRecord;
          newClassValue = currentClass;
          newSessionValue = newSession;
          
          // Keep same section if exists
          if (student.sectionId) {
            newSectionId = student.sectionId;
            newSectionName = oldSection;
          }
        } else {
          // Promote to next class
          newClassRecord = nextClassRecord;
          newClassValue = nextClass;
          // Determine session to set: prefer explicitly provided session; else current session configured for the new program; else fallback to computed next session
          // We'll set a provisional value here; will finalize after resolving newProgram below
          newSessionValue = requestSession;
          
          // Maintain section logic: try to find same section name in next class
          // This is a fallback if targetSectionId is not provided
          if (!targetSectionId && student.sectionId && oldSection) {
            let targetSection = await prisma.section.findUnique({
              where: {
                classId_name: {
                  classId: newClassRecord.id,
                  name: oldSection
                }
              }
            });

            // If section doesn't exist in next class, create it
            if (!targetSection) {
              try {
                targetSection = await prisma.section.create({
                  data: {
                    name: oldSection,
                    classId: newClassRecord.id
                  }
                });
              } catch (sectionError) {
                logger.error('Failed to create section', { 
                  section: oldSection, 
                  class: newClassValue, 
                  error: sectionError 
                });
                // Continue without section if creation fails
                targetSection = null;
              }
            }

            if (targetSection) {
              newSectionId = targetSection.id;
              newSectionName = targetSection.name;
            }
          }
        }

        // Get the program from the new class (not the old student)
        const newProgram = newClassRecord.program || student.program;

        // If session not provided, try to read current session from settings for this program
        if (!newSessionValue) {
          const currentSession = await prisma.programSession.findFirst({
            where: { program: newProgram, isCurrent: true }
          });
          if (currentSession) {
            newSessionValue = currentSession.session;
          } else {
            // Fallback: compute next session string if no configured session exists
            const currentYear = new Date().getFullYear();
            newSessionValue = `${currentYear}-${currentYear + 1}`;
          }
        }
        
        // Get program fee for new class
        const programFee = await prisma.programFee.findUnique({
          where: { program: newProgram }
        });

        if (!programFee) {
          errors.push(`No program fee found for ${student.name} (Program: ${newProgram})`);
          continue;
        }

        // Determine target section - use provided targetSectionId if available
        let finalSectionId = newSectionId;
        let finalSectionName = newSectionName || student.section;
        
        if (targetSectionId) {
          const parsedTargetSectionId = parseInteger(targetSectionId);
          if (parsedTargetSectionId) {
            const targetSection = await prisma.section.findUnique({
              where: { id: parsedTargetSectionId }
            });
            if (targetSection && targetSection.classId === newClassRecord.id) {
              finalSectionId = parsedTargetSectionId;
              finalSectionName = targetSection.name;
            }
          }
        }

        // Get all unpaid fees before updating student
        const unpaidFees = await prisma.fee.findMany({
          where: {
            studentId: student.id,
            paid: false
          }
        });

        // Update existing student record (keep ACTIVE status)
        // Don't create a new record - just update the existing one
        const updatedStudent = await prisma.student.update({
          where: { id: student.id },
          data: {
            program: newProgram,
            session: newSessionValue,
            class: newClassValue,
            section: finalSectionName,
            classId: newClassRecord.id,
            sectionId: finalSectionId,
            // Keep all other fields the same, including status = ACTIVE
          },
          include: {
            classRelation: true,
            sectionRelation: true
          }
        });

        // Update unpaid fees to use the new program's fee amount
        // ONLY update unpaid fees for current month or future months (not past months)
        if (unpaidFees.length > 0 && programFee) {
          try {
            const monthNames = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"];
            
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
                    amount: programFee.feeAmount
                    // Don't update historical data - it should remain as it was when fee was created
                  }
                });
                updatedCount++;
              }
            }
            
            if (updatedCount > 0) {
              logger.info(`Updated ${updatedCount} unpaid fee(s) for current/future months for ${updatedStudent.name} to new program fee amount: ${programFee.feeAmount}`);
            }
          } catch (feeUpdateError) {
            logger.error('Failed to update unpaid fees for promoted student', { 
              studentName: updatedStudent.name, 
              studentId: updatedStudent.id, 
              error: feeUpdateError 
            });
          }
        }

        // Generate fee for current month (if it doesn't exist already)
        // The fee amount will automatically use the new program's fee since we updated the student
        try {
          await generateFeeForStudent(updatedStudent.id);
        } catch (feeError) {
          logger.error('Failed to generate fee for promoted student', { 
            studentName: updatedStudent.name, 
            studentId: updatedStudent.id, 
            error: feeError 
          });
        }

        // Create promotion log
        await prisma.studentPromotion.create({
          data: {
            studentId: updatedStudent.id,
            oldClass,
            newClass: newClassValue,
            oldSession,
            newSession: newSessionValue,
            status: action === 'REPEAT' ? 'REPEATED' : 'PROMOTED',
            promotedBy: userId
          }
        });

        promotedStudents.push({
          id: updatedStudent.id,
          name: updatedStudent.name,
          oldClass,
          newClass: newClassValue,
          action
        });
      } catch (error) {
        errors.push(`Failed to promote ${student.name}: ${error.message}`);
      }
    }

  sendSuccess(res, {
    promotedCount: promotedStudents.length,
    students: promotedStudents,
    errors: errors.length > 0 ? errors : undefined
  }, `Successfully ${action === 'REPEAT' ? 'repeated' : 'promoted'} ${promotedStudents.length} student(s)`);
});

// Get promotion history
export const getPromotionHistory = asyncHandler(async (req, res) => {
  const { studentId, class: className } = req.query;
  
  const where = {};
  if (studentId) {
    where.studentId = parseInteger(studentId);
  }

  const promotions = await prisma.studentPromotion.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          rollNo: true,
          class: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter by class if specified
  let filteredPromotions = promotions;
  if (className) {
    filteredPromotions = promotions.filter(p => 
      p.oldClass === className || p.newClass === className
    );
  }

  sendSuccess(res, { promotions: filteredPromotions, count: filteredPromotions.length });
});

// Get classes for promotion dropdown
export const getClassesForPromotion = asyncHandler(async (req, res) => {
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
      program: true
    },
    orderBy: { name: 'asc' }
  });

  sendSuccess(res, { classes });
});

