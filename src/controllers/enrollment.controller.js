import { prisma } from '../lib/prisma.js';

export const courseEnrollment = async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    const enrollment = await prisma.$transaction(async (tx) => {
      // 1️⃣ Verify course exists and belongs to tenant
      const course = await tx.course.findFirst({
        where: { id: courseId, tenantId }
      });

      if (!course) {
        throw new Error('Course not found or access denied');
      }

      if (!course.isPublished) {
        throw new Error('Cannot enroll in unpublished course');
      }

      // 2️⃣ Prevent duplicate enrollment
      const existing = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });

      if (existing) {
        throw new Error('Already enrolled in this course');
      }

      // 3️⃣ Create enrollment with tenantId
      return tx.enrollment.create({
        data: {
          userId,
          courseId,
          tenantId // ✅ important for multi-tenant safety
        }
      });
    });

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};
