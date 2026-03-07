import { prisma } from '../lib/prisma.js';

export const markLessonCompleted = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId, tenantId } = req.user;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      //  Validate lesson
      const lesson = await tx.lesson.findFirst({
        where: {
          id: lessonId,
          tenantId,
          deletedAt: null
        },
        select: {
          id: true,
          courseId: true
        }
      });

      if (!lesson) throw new Error('LESSON_NOT_FOUND');

      //  Validate enrollment
      const enrollment = await tx.enrollment.findFirst({
        where: {
          tenantId,
          userId,
          courseId: lesson.courseId,
          deletedAt: null
        }
      });

      if (!enrollment) throw new Error('NOT_ENROLLED');

      //  Upsert progress
      await tx.progress.upsert({
        where: {
          tenantId_userId_lessonId: {
            tenantId,
            userId,
            lessonId
          }
        },
        update: {
          completed: true,
          completedAt: now,
          deletedAt: null
        },
        create: {
          tenantId,
          userId,
          lessonId,
          courseId: lesson.courseId,
          completed: true,
          completedAt: now
        }
      });

      //  Count lessons
      const [totalLessons, completedLessons] = await Promise.all([
        tx.lesson.count({
          where: {
            courseId: lesson.courseId,
            tenantId,
            deletedAt: null
          }
        }),
        tx.progress.count({
          where: {
            userId,
            courseId: lesson.courseId,
            tenantId,
            completed: true,
            deletedAt: null
          }
        })
      ]);

      const lessonsCompleted = totalLessons > 0 && completedLessons === totalLessons;

      const lessonProgressPercentage =
        totalLessons === 0 ? 0 : Math.floor((completedLessons / totalLessons) * 100);

      return {
        courseId: lesson.courseId,
        totalLessons,
        completedLessons,
        lessonsCompleted,
        lessonProgressPercentage
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed',
      data: result
    });
  } catch (error) {
    if (error.message === 'LESSON_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    if (error.message === 'NOT_ENROLLED') {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    next(error);
  }
};
