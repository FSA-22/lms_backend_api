import { prisma } from '../lib/prisma.js';

export const studentDashboard = async (req, res, next) => {
  const { id: userId, tenantId } = req.user;

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, tenantId },
      include: {
        course: {
          include: {
            lessons: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    const dashboard = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = enrollment.course.lessons.length;

        const completedLessons = await prisma.progress.count({
          where: {
            userId,
            courseId: enrollment.course.id,
            tenantId,
            completed: true
          }
        });

        const percentage =
          totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

        return {
          courseId: enrollment.course.id,
          title: enrollment.course.title,
          totalLessons,
          completedLessons,
          percentage
        };
      })
    );

    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
};
