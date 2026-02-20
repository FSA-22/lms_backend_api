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

export const getLessonsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { id: userId, tenantId, roles } = req.user;

    const course = await prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If student, verify enrollment
    if (roles.includes('STUDENT')) {
      const enrolled = await prisma.enrollment.findFirst({
        where: { userId, courseId, deletedAt: null }
      });

      if (!enrolled) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        courseId,
        tenantId,
        deletedAt: null,
        ...(roles.includes('STUDENT') && { isPublished: true })
      },
      orderBy: { order: 'asc' }
    });

    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { id: userId, tenantId, roles } = req.user;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        tenantId,
        deletedAt: null
      },
      include: { course: true }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // If student → must be enrolled + lesson must be published
    if (roles.includes('STUDENT')) {
      if (!lesson.isPublished) {
        return res.status(403).json({ message: 'Lesson not available' });
      }

      const enrolled = await prisma.enrollment.findFirst({
        where: { userId, courseId: lesson.courseId, deletedAt: null }
      });

      if (!enrolled) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    }

    res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { title, content, order, isPublished } = req.body;
    const { id: userId, tenantId } = req.user;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        tenantId,
        deletedAt: null,
        course: { instructorId: userId }
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found or not owned' });
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        content,
        order,
        isPublished
      }
    });

    res.status(200).json({ message: 'Lesson updated', lesson: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { id: userId, tenantId } = req.user;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        tenantId,
        deletedAt: null,
        course: { instructorId: userId }
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found or not owned' });
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};
