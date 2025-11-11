import { PrismaClient } from "@prisma/client";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/constants.js";

const prisma = new PrismaClient();

// Get all sections for a class
export const getSectionsByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const sections = await prisma.section.findMany({
      where: { classId: parseInt(classId) },
      include: {
        _count: {
          select: { students: { where: { status: 'ACTIVE' } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    const sectionsWithStudentCount = sections.map(section => ({
      ...section,
      activeStudentsCount: section._count.students
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { sections: sectionsWithStudentCount, count: sectionsWithStudentCount.length }
    });
  } catch (error) {
    next(error);
  }
};

// Get single section
export const getSection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const section = await prisma.section.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: true,
        students: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { students: { where: { status: 'ACTIVE' } } }
        }
      }
    });

    if (!section) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Section not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { ...section, activeStudentsCount: section._count.students }
    });
  } catch (error) {
    next(error);
  }
};

// Create new section
export const createSection = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Section name is required'
      });
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    });

    if (!classExists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if section with same name already exists in this class
    const existingSection = await prisma.section.findUnique({
      where: {
        classId_name: {
          classId: parseInt(classId),
          name: name.trim()
        }
      }
    });

    if (existingSection) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Section "${name.trim()}" already exists in this class`
      });
    }

    const newSection = await prisma.section.create({
      data: {
        name: name.trim(),
        classId: parseInt(classId)
      },
      include: {
        _count: {
          select: { students: { where: { status: 'ACTIVE' } } }
        }
      }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: {
        section: {
          ...newSection,
          activeStudentsCount: newSection._count.students
        }
      }
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Section "${req.body.name.trim()}" already exists in this class`
      });
    }
    next(error);
  }
};

// Update section
export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Section name is required'
      });
    }

    // Get current section to check classId
    const currentSection = await prisma.section.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentSection) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check if new name conflicts with existing section in same class
    const existingSection = await prisma.section.findUnique({
      where: {
        classId_name: {
          classId: currentSection.classId,
          name: name.trim()
        }
      }
    });

    if (existingSection && existingSection.id !== parseInt(id)) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Section "${name.trim()}" already exists in this class`
      });
    }

    const updatedSection = await prisma.section.update({
      where: { id: parseInt(id) },
      data: { name: name.trim() },
      include: {
        _count: {
          select: { students: { where: { status: 'ACTIVE' } } }
        }
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: {
        section: {
          ...updatedSection,
          activeStudentsCount: updatedSection._count.students
        }
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Section "${req.body.name.trim()}" already exists in this class`
      });
    }
    next(error);
  }
};

// Delete section
export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if there are any active students in this section
    const activeStudentsInSection = await prisma.student.count({
      where: { sectionId: parseInt(id), status: 'ACTIVE' }
    });

    if (activeStudentsInSection > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot delete section. ${activeStudentsInSection} active students are registered in this section.`
      });
    }

    await prisma.section.delete({
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

