import { prisma } from '../lib/prisma.js';

// SUBMIT RESULT
export const submitAssessmentResult = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { score } = req.body;
    const { tenantId, id: userId } = req.user;

    if (!assessmentId) {
      return res.status(400).json({ message: 'Assessment ID is required' });
    }

    if (typeof score !== 'number') {
      return res.status(400).json({ message: 'Score must be a number' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.findFirst({
        where: { id: assessmentId, tenantId, deletedAt: null }
      });

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      if (score < 0 || score > assessment.totalMarks) {
        throw new Error('Invalid score value');
      }

      const enrolled = await tx.enrollment.findFirst({
        where: {
          userId,
          courseId: assessment.courseId,
          deletedAt: null
        }
      });

      if (!enrolled) {
        throw new Error('Student not enrolled in course');
      }

      const existing = await tx.assessmentResult.findUnique({
        where: {
          assessmentId_userId: { assessmentId, userId }
        }
      });

      if (existing && !existing.deletedAt) {
        throw new Error('Assessment already submitted');
      }

      return tx.assessmentResult.create({
        data: {
          tenantId,
          assessmentId,
          userId,
          score,
          passed: score >= assessment.totalMarks * 0.5
        }
      });
    });

    res.status(201).json({
      message: 'Assessment submitted successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

// GET RESULTS BY ASSESSMENT
export const getResultsByAssessment = async (req, res, next) => {
  try {
    const { slug, assessmentId } = req.params;
    const { tenantId, id: userId } = req.user;

    if (!assessmentId) {
      return res.status(400).json({ message: 'Assessment ID is required' });
    }

    if (!slug) {
      return res.status(400).json({ message: 'Tenant slug is required' });
    }

    /**
     *  Validate tenant by slug
     */
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant || tenant.id !== tenantId) {
      return res.status(403).json({ message: 'Invalid tenant access' });
    }

    /**
     *  Validate assessment belongs to tenant
     *    AND instructor owns the course
     */
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        tenantId: tenant.id,
        deletedAt: null,
        course: {
          instructorId: userId,
          deletedAt: null
        }
      },
      include: {
        course: true
      }
    });

    if (!assessment) {
      return res.status(404).json({
        message: 'Assessment not found or not owned by instructor'
      });
    }

    /**
     *  Fetch results scoped to tenant
     */
    const results = await prisma.assessmentResult.findMany({
      where: {
        assessmentId,
        tenantId: tenant.id,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
};

//  GET STUDENT RESULTS
export const getStudentResults = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { tenantId, id: userId, roles } = req.user;

    if (roles.includes('STUDENT') && userId !== studentId)
      return res.status(403).json({ message: "Cannot view other student's results" });

    const results = await prisma.assessmentResult.findMany({
      where: { userId: studentId, tenantId, deletedAt: null },
      include: { assessment: true }
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
};
