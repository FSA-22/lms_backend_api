import { prisma } from '../lib/prisma.js';

export const markLessonCompleted = async (req, res, next) => {
  const { lessonId } = req.body;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    const progress = await prisma.$transaction(async (tx) => {
      //  Ensure lesson belongs to student's tenant via course
      const lesson = await tx.lesson.findFirst({
        where: {
          id: lessonId,
          course: { tenantId }
        },
        include: { course: true }
      });

      if (!lesson) throw new Error('Lesson not found or access denied');

      // Prevent duplicate progress
      const existing = await tx.progress.findUnique({
        where: { userId_lessonId: { userId, lessonId } }
      });

      if (existing) throw new Error('Lesson already marked completed');

      // Mark lesson completed
      const newProgress = await tx.progress.create({
        data: { userId, lessonId, completed: true, completedAt: new Date() }
      });

      return newProgress;
    });

    res.status(201).json({ message: 'Lesson completed', progress });
  } catch (error) {
    next(error);
  }
};
