import { prisma } from '../lib/prisma.js';

// ================= CREATE ASSESSMENT =================
export const createAssessment = async (req, res, next) => {
  try {
    const { title, type, totalMarks } = req.body;
    const { tenantId, id: userId } = req.user;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // verify instructor owns course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId,
        instructorId: userId,
        deletedAt: null
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not owned by instructor'
      });
    }

    const assessment = await prisma.assessment.create({
      data: {
        tenantId,
        courseId,
        title,
        type,
        totalMarks
      }
    });

    res.status(201).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ASSESSMENTS FOR COURSE =================
export const getAssessments = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { courseId } = req.params;

    const assessments = await prisma.assessment.findMany({
      where: {
        tenantId,
        courseId,
        deletedAt: null
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ASSESSMENT BY ID =================

export const getAssessmentById = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        deletedAt: null
      },
      include: {
        course: true,
        results: {
          where: { deletedAt: null }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE ASSESSMENT =================
export const updateAssessment = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { assessmentId } = req.params;
    const { title, type, totalMarks } = req.body;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        deletedAt: null
      },
      include: { course: true }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.course.instructorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to update this assessment'
      });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (totalMarks !== undefined) updateData.totalMarks = totalMarks;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: updateData
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE ASSESSMENT (SOFT DELETE) =================
export const deleteAssessment = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        deletedAt: null
      },
      include: { course: true }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.course.instructorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to delete this assessment'
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessmentResult.updateMany({
        where: {
          assessmentId,
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });

      await tx.question.updateMany({
        where: {
          assessmentId,
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          deletedAt: new Date()
        }
      });
    });

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ================= STUDENT ACCESS ASSESSMENTS =================
export const getStudentAssessments = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { courseId } = req.params;

    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({
        where: {
          courseId,
          tenantId,
          deletedAt: null
        }
      }),

      prisma.progress.count({
        where: {
          courseId,
          tenantId,
          userId,
          completed: true,
          deletedAt: null
        }
      })
    ]);

    if (totalLessons > 0 && completedLessons !== totalLessons) {
      return res.status(403).json({
        success: false,
        message: 'Complete all lessons before accessing assessments'
      });
    }

    const assessments = await prisma.assessment.findMany({
      where: {
        courseId,
        tenantId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    next(error);
  }
};
