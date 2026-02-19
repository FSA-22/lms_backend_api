import { prisma } from '../lib/prisma.js';

export const submitAssessment = async (req, res, next) => {
  const { assessmentId } = req.params;
  const { score } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check assessment exists & belongs to tenant
      const assessment = await tx.assessment.findFirst({
        where: {
          id: assessmentId,
          course: { tenantId }
        },
        include: { course: true }
      });
      if (!assessment) throw new Error('Assessment not found or access denied');

      //  Prevent duplicate submission
      const existing = await tx.assessmentResult.findUnique({
        where: { assessmentId_userId: { assessmentId, userId } }
      });
      if (existing) throw new Error('Assessment already submitted');

      // Create assessment result
      const passed = score >= assessment.totalMarks * 0.5; // Example: 50% passing
      const assessmentResult = await tx.assessmentResult.create({
        data: {
          assessmentId,
          userId,
          score,
          passed,
          submittedAt: new Date()
        }
      });

      return assessmentResult;
    });

    res.status(201).json({ message: 'Assessment submitted', result });
  } catch (error) {
    next(error);
  }
};
