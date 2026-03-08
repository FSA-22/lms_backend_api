import { prisma } from '../lib/prisma.js';

export const markLessonProgress = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId, tenantId } = req.user;
  const {
    videoProgress = null, // percentage watched for video lessons
    readingProgress = null // percentage read for text lessons
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      //  Validate lesson
      const lesson = await tx.lesson.findFirst({
        where: { id: lessonId, tenantId, deletedAt: null },
        select: {
          id: true,
          courseId: true,
          contents: {
            select: { type: true }
          }
        }
      });

      if (!lesson) throw new Error('LESSON_NOT_FOUND');

      // 2️⃣ Validate enrollment
      const enrollment = await tx.enrollment.findFirst({
        where: { tenantId, userId, courseId: lesson.courseId, deletedAt: null }
      });

      if (!enrollment) throw new Error('NOT_ENROLLED');

      // 3️⃣ Determine lesson type from contents
      let lessonType = 'TEXT';
      if (lesson.contents.some((c) => c.type === 'VIDEO')) lessonType = 'VIDEO';

      // 4️⃣ Determine completion
      let completed = false;
      switch (lessonType) {
        case 'VIDEO':
          completed = videoProgress >= 90; // you can adjust threshold or read from completionRule JSON
          break;
        case 'TEXT':
          completed = readingProgress >= 90; // default reading threshold
          break;
        default:
          completed = true; // fallback
      }

      // 5️⃣ Upsert Progress
      await tx.progress.upsert({
        where: {
          tenantId_userId_lessonId: { tenantId, userId, lessonId }
        },
        update: {
          completed,
          completedAt: completed ? now : null,
          courseId: lesson.courseId,
          deletedAt: null
        },
        create: {
          tenantId,
          userId,
          lessonId,
          courseId: lesson.courseId,
          completed,
          completedAt: completed ? now : null
        }
      });

      // 6️⃣ Recalculate course progress
      const [totalLessons, completedLessons] = await Promise.all([
        tx.lesson.count({ where: { courseId: lesson.courseId, tenantId, deletedAt: null } }),
        tx.progress.count({
          where: { userId, courseId: lesson.courseId, tenantId, completed: true, deletedAt: null }
        })
      ]);

      const lessonsCompleted = totalLessons > 0 && completedLessons === totalLessons;
      const lessonProgressPercentage =
        totalLessons === 0 ? 0 : Math.floor((completedLessons / totalLessons) * 100);

      // Optional: trigger certificate or notifications if lessonsCompleted

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
      message: 'Lesson progress updated',
      data: result
    });
  } catch (error) {
    if (error.message === 'LESSON_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (error.message === 'NOT_ENROLLED') {
      return res
        .status(403)
        .json({ success: false, message: 'You are not enrolled in this course' });
    }

    next(error);
  }
};
