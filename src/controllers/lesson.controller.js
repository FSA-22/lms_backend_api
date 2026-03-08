import { prisma } from '../lib/prisma.js';

export const createLesson = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const { courseId } = req.params;
    // const tenantId = req.tenant.id;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const lesson = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findFirst({
        where: {
          id: courseId,
          tenantId,
          deletedAt: null
        }
      });

      if (!course) throw new Error('COURSE_NOT_FOUND');

      // Instructor ownership restriction
      if (
        roles.includes('INSTRUCTOR') &&
        !roles.includes('ADMIN') &&
        course.instructorId !== userId
      ) {
        throw new Error('UNAUTHORIZED');
      }

      const { _max } = await tx.lesson.aggregate({
        where: { courseId, tenantId },
        _max: { order: true }
      });

      const nextOrder = (_max.order || 0) + 1;

      return tx.lesson.create({
        data: {
          courseId,
          tenantId,
          title,
          content,
          order: nextOrder
        }
      });
    });

    res.status(201).json({
      message: 'Lesson created',
      lesson
    });
  } catch (error) {
    if (error.message === 'COURSE_NOT_FOUND')
      return res.status(404).json({ message: 'Course not found' });

    if (error.message === 'UNAUTHORIZED') return res.status(403).json({ message: 'Not allowed' });

    next(error);
  }
};

export const getLessonsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    // const tenantId = req.tenant.id;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const course = await prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null }
    });

    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Students must be enrolled
    if (roles.includes('STUDENT')) {
      if (!course.isPublished) return res.status(403).json({ message: 'Course not available' });

      const enrolled = await prisma.enrollment.findFirst({
        where: { userId, courseId, deletedAt: null }
      });

      if (!enrolled) return res.status(403).json({ message: 'Not enrolled' });
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

export const getLessonsByCourse1 = async (req, res, next) => {
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
    const { lessonId, courseId } = req.params;
    // const tenantId = req.tenant.id;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId,
        tenantId,
        deletedAt: null
      },
      include: { course: true }
    });

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (roles.includes('STUDENT')) {
      if (!lesson.isPublished) return res.status(403).json({ message: 'Lesson not available' });

      const enrolled = await prisma.enrollment.findFirst({
        where: { userId, courseId, deletedAt: null }
      });

      if (!enrolled) return res.status(403).json({ message: 'Not enrolled' });
    }

    res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
};
export const getLessonById1 = async (req, res, next) => {
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
    const { lessonId, courseId } = req.params;
    const { title, content, order, isPublished } = req.body;

    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId, tenantId, deletedAt: null },
      include: { course: true }
    });

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (
      roles.includes('INSTRUCTOR') &&
      !roles.includes('ADMIN') &&
      lesson.course.instructorId !== userId
    )
      return res.status(403).json({ message: 'Not allowed' });

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: title ?? lesson.title,
        content: content ?? lesson.content,
        isPublished: isPublished ?? lesson.isPublished,
        ...(order && { order })
      }
    });

    res.status(200).json({ message: 'Lesson updated', lesson: updated });
  } catch (error) {
    next(error);
  }
};

export const updateLesson1 = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { title, content, order, isPublished } = req.body;
    const { id: userId, tenantId } = req.user;

    // const lesson = await prisma.lesson.findFirst({
    //   where: {
    //     id: lessonId,
    //     tenantId,
    //     deletedAt: null,
    //     course: { instructorId: userId }
    //   }
    // });

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        tenantId,
        deletedAt: null
      },
      include: { course: true }
    });

    if (!lesson || lesson.course.instructorId !== userId) {
      return res.status(404).json({ message: 'Lesson not found or not owned' });
    }

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
    const { lessonId, courseId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId, tenantId, deletedAt: null },
      include: { course: true }
    });

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (
      roles.includes('INSTRUCTOR') &&
      !roles.includes('ADMIN') &&
      lesson.course.instructorId !== userId
    )
      return res.status(403).json({ message: 'Not allowed' });

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson1 = async (req, res, next) => {
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
