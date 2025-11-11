import { PrismaClient } from "@prisma/client";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/constants.js";

const prisma = new PrismaClient();

// Get all classes with student counts and sections
export const getClasses = async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        sections: {
          include: {
            _count: {
              select: {
                students: {
                  where: {
                    status: 'ACTIVE'
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            students: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const classesWithData = classes.map(classItem => ({
      ...classItem,
      activeStudentsCount: classItem._count.students,
      sections: classItem.sections.map(section => ({
        id: section.id,
        name: section.name,
        activeStudentsCount: section._count.students
      }))
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { classes: classesWithData, count: classesWithData.length }
    });
  } catch (error) {
    next(error);
  }
};

// Get single class with students and sections
export const getClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const classItem = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        sections: {
          include: {
            _count: {
              select: {
                students: {
                  where: {
                    status: 'ACTIVE'
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        students: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            sectionRelation: true,
            fees: {
              where: {
                paid: false
              }
            }
          }
        },
        _count: {
          select: {
            students: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    });
    
    if (!classItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...classItem,
        activeStudentsCount: classItem._count.students,
        sections: classItem.sections.map(section => ({
          ...section,
          activeStudentsCount: section._count.students
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new class
export const createClass = async (req, res, next) => {
  try {
    const { name, program, description } = req.body;
    
    if (!name || !program) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Class name and program are required'
      });
    }
    
    const classItem = await prisma.class.create({
      data: { 
        name,
        program,
        description: description || null
      }
    });
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: { class: classItem }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Class with this name already exists'
      });
    }
    next(error);
  }
};

// Update class
export const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, program, description } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (program) updateData.program = program;
    if (description !== undefined) updateData.description = description;
    
    const classItem = await prisma.class.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: { class: classItem }
    });
  } catch (error) {
    next(error);
  }
};

// Delete class
export const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if class has students
    const studentsCount = await prisma.student.count({
      where: { classId: parseInt(id), status: 'ACTIVE' }
    });
    
    if (studentsCount > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot delete class. It has ${studentsCount} active students.`
      });
    }
    
    await prisma.class.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DELETED
    });
  } catch (error) {
    next(error);
  }
};

