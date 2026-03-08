import { prisma } from '../lib/prisma.js';

// export const markLessonCompleted = async (req, res, next) => {
//   const { lessonId } = req.params;
//   const { id: userId, tenantId } = req.user;

//   console.log(id, lessonId, tenantId);

//   try {
//     const progress = await prisma.$transaction(async (tx) => {
//       // Get lesson and validate tenant
//       const lesson = await tx.lesson.findFirst({
//         where: {
//           id: lessonId,
//           tenantId,
//           deletedAt: null
//         }
//       });

//       if (!lesson) {
//         throw new Error('LESSON_NOT_FOUND');
//       }

//       // Ensure student is enrolled in the course
//       const enrollment = await tx.enrollment.findFirst({
//         where: {
//           userId,
//           courseId: lesson.courseId,
//           tenantId
//         }
//       });

//       if (!enrollment) {
//         throw new Error('NOT_ENROLLED');
//       }

//       // Use upsert instead of manual duplicate check
//       return tx.progress.upsert({
//         where: {
//           userId_lessonId: {
//             userId,
//             lessonId
//           }
//         },
//         update: {
//           completed: true,
//           completedAt: new Date()
//         },
//         create: {
//           tenantId,
//           userId,
//           lessonId,
//           completed: true,
//           completedAt: new Date()
//         }
//       });

//       //       const totalLessons = await tx.lesson.count({
//       //   where: {
//       //     courseId: lesson.courseId,
//       //     tenantId,
//       //     deletedAt: null
//       //   }
//       // });

//       // const completedLessons = await tx.progress.count({
//       //   where: {
//       //     courseId: lesson.courseId,
//       //     tenantId,
//       //     userId,
//       //     completed: true
//       //   }
//       // });

//       // if (totalLessons > 0 && totalLessons === completedLessons) {
//       //   await tx.courseProgress.upsert({
//       //     where: {
//       //       userId_courseId: {
//       //         userId,
//       //         courseId: lesson.courseId
//       //       }
//       //     },
//       //     update: {
//       //       completed: true,
//       //       completedAt: new Date()
//       //     },
//       //     create: {
//       //       tenantId,
//       //       userId,
//       //       courseId: lesson.courseId,
//       //       completed: true,
//       //       completedAt: new Date()
//       //     }
//       //   });
//       // }
//     });

//     return res.status(200).json({
//       message: 'Lesson marked as completed',
//       progress
//     });
//   } catch (error) {
//     if (error.message === 'LESSON_NOT_FOUND') {
//       return res.status(404).json({ message: 'Lesson not found' });
//     }

//     if (error.message === 'NOT_ENROLLED') {
//       return res.status(403).json({ message: 'You are not enrolled in this course' });
//     }

//     next(error);
//   }
// };

export const markLessonCompleted = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId, tenantId } = req.user;

  console.log(userId, lessonId, tenantId);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validate lesson
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

      if (!lesson) {
        throw new Error('LESSON_NOT_FOUND');
      }

      // 2️⃣ Validate enrollment
      const enrollment = await tx.enrollment.findFirst({
        where: {
          tenantId,
          userId,
          courseId: lesson.courseId,
          deletedAt: null
        }
      });

      if (!enrollment) {
        throw new Error('NOT_ENROLLED');
      }

      // 3️⃣ Upsert lesson progress (idempotent)
      await tx.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        update: {
          completed: true,
          completedAt: new Date(),
          deletedAt: null
        },
        create: {
          tenantId,
          userId,
          lessonId,
          courseId: lesson.courseId,
          completed: true,
          completedAt: new Date()
        }
      });

      // 4️⃣ Count lessons
      const totalLessons = await tx.lesson.count({
        where: { courseId: lesson.courseId, tenantId, deletedAt: null }
      });

      const completedLessons = await tx.progress.count({
        where: { userId, courseId: lesson.courseId, tenantId, completed: true, deletedAt: null }
      });

      // 5️⃣ Compute lesson completion
      const lessonsCompleted = totalLessons > 0 && completedLessons === totalLessons;
      const lessonProgressPercentage =
        totalLessons === 0 ? 0 : Math.floor((completedLessons / totalLessons) * 100);

      return {
        totalLessons,
        completedLessons,
        lessonsCompleted,
        lessonProgressPercentage
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Lesson marked as completed',
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
