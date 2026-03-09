import { prisma } from '../lib/prisma.js';

// ================= SUBMIT ASSESSMENT =================
export const submitAssessmentResult = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { tenantId, id: userId } = req.user;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validate assessment
      const assessment = await tx.assessment.findFirst({
        where: {
          id: assessmentId,
          tenantId,
          deletedAt: null
        },
        include: {
          course: true
        }
      });

      if (!assessment) throw new Error('ASSESSMENT_NOT_FOUND');

      // 2️⃣ Ensure student is enrolled
      const enrolled = await tx.enrollment.findFirst({
        where: {
          userId,
          courseId: assessment.courseId,
          deletedAt: null
        }
      });

      if (!enrolled) throw new Error('NOT_ENROLLED');

      // 3️⃣ Ensure lessons completed
      const [totalLessons, completedLessons] = await Promise.all([
        tx.lesson.count({
          where: {
            courseId: assessment.courseId,
            tenantId,
            deletedAt: null
          }
        }),

        tx.progress.count({
          where: {
            userId,
            courseId: assessment.courseId,
            tenantId,
            completed: true,
            deletedAt: null
          }
        })
      ]);

      if (totalLessons > 0 && completedLessons !== totalLessons) {
        throw new Error('LESSONS_NOT_COMPLETED');
      }

      // 4️⃣ Prevent duplicate submission
      const existing = await tx.assessmentResult.findUnique({
        where: {
          assessmentId_userId: {
            assessmentId,
            userId
          }
        }
      });

      if (existing && !existing.deletedAt) {
        throw new Error('ALREADY_SUBMITTED');
      }

      // 5️⃣ Get all questions
      const questions = await tx.question.findMany({
        where: {
          assessmentId,
          tenantId
        }
      });

      // 6️⃣ Get student answers
      const answers = await tx.studentAnswer.findMany({
        where: {
          tenantId,
          userId,
          question: { assessmentId }
        }
      });

      // 7️⃣ Calculate score
      let totalScore = 0;
      let maxScore = 0;

      for (const question of questions) {
        maxScore += question.marks;

        const answer = answers.find((a) => a.questionId === question.id);

        if (!answer) continue;

        totalScore += answer.score ?? 0;
      }

      // 8️⃣ Determine pass status
      const passed = totalScore >= assessment.totalMarks * 0.5;

      // 9️⃣ Save result
      const newResult = await tx.assessmentResult.create({
        data: {
          tenantId,
          assessmentId,
          userId,
          score: totalScore,
          passed
        }
      });

      return {
        result: newResult,
        totalScore,
        maxScore
      };
    });

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      score: result.totalScore,
      maxScore: result.maxScore,
      data: result.result
    });
  } catch (error) {
    if (error.message === 'LESSONS_NOT_COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'Complete all lessons before submitting assessment'
      });
    }

    if (error.message === 'ALREADY_SUBMITTED') {
      return res.status(409).json({
        success: false,
        message: 'Assessment already submitted'
      });
    }

    if (error.message === 'ASSESSMENT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (error.message === 'NOT_ENROLLED') {
      return res.status(403).json({
        success: false,
        message: 'Student not enrolled in this course'
      });
    }

    next(error);
  }
};

// ================= GET RESULTS BY ASSESSMENT =================
export const getResultsByAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { tenantId, id: userId } = req.user;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        deletedAt: null,
        course: { instructorId: userId }
      }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or not owned by instructor'
      });
    }

    const results = await prisma.assessmentResult.findMany({
      where: {
        assessmentId,
        tenantId,
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
        score: 'desc'
      }
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET STUDENT RESULTS =================
export const getStudentResults = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { tenantId, id: userId } = req.user;

    if (userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Cannot view another student's results"
      });
    }

    const results = await prisma.assessmentResult.findMany({
      where: {
        userId: studentId,
        tenantId,
        deletedAt: null
      },
      include: {
        assessment: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
