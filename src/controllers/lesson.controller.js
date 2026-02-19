import { prisma } from '../lib/prisma';

export const createLesson = async (req, res, next) => {
  const { courseId, title, content } = req.body;
  const { tenantId } = req.user;

  try {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        content
      }
    });

    res.status(201).json(lesson);
  } catch (error) {
    next(error);
  }
};
