import { prisma } from '../lib/prisma.js';

export const createLessonContent = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { type, title, text, imageUrl, videoUrl } = req.body;

    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const content = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findFirst({
        where: {
          id: lessonId,
          tenantId,
          deletedAt: null
        },
        include: { course: true }
      });

      if (!lesson) throw new Error('LESSON_NOT_FOUND');

      if (lesson.course.instructorId !== userId) throw new Error('UNAUTHORIZED');

      const { _max } = await tx.lessonContent.aggregate({
        where: { lessonId },
        _max: { order: true }
      });

      const nextOrder = (_max.order || 0) + 1;

      return tx.lessonContent.create({
        data: {
          lessonId,
          type,
          title,
          text,
          imageUrl,
          videoUrl,
          order: nextOrder
        }
      });
    });

    res.status(201).json({
      message: 'Lesson content created',
      content
    });
  } catch (error) {
    if (error.message === 'LESSON_NOT_FOUND')
      return res.status(404).json({ message: 'Lesson not found' });

    if (error.message === 'UNAUTHORIZED') return res.status(403).json({ message: 'Not allowed' });

    next(error);
  }
};

export const getLessonContents = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const tenantId = req.user.tenantId;

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, tenantId, deletedAt: null }
    });

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const contents = await prisma.lessonContent.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' }
    });

    res.status(200).json(contents);
  } catch (error) {
    next(error);
  }
};

export const updateLessonContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { title, text, imageUrl, videoUrl } = req.body;
    const userId = req.user.id;

    const content = await prisma.lessonContent.findUnique({
      where: { id: contentId },
      include: {
        lesson: {
          include: { course: true }
        }
      }
    });

    if (!content) return res.status(404).json({ message: 'Content not found' });

    if (content.lesson.course.instructorId !== userId)
      return res.status(403).json({ message: 'Not allowed' });

    const updated = await prisma.lessonContent.update({
      where: { id: contentId },
      data: {
        title,
        text,
        imageUrl,
        videoUrl
      }
    });

    res.status(200).json({
      message: 'Lesson content updated',
      content: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLessonContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    const content = await prisma.lessonContent.findUnique({
      where: { id: contentId },
      include: {
        lesson: {
          include: { course: true }
        }
      }
    });

    if (!content) return res.status(404).json({ message: 'Content not found' });

    if (content.lesson.course.instructorId !== userId)
      return res.status(403).json({ message: 'Not allowed' });

    await prisma.lessonContent.delete({
      where: { id: contentId }
    });

    res.status(204).json({ message: 'Lesson content deleted' });
  } catch (error) {
    next(error);
  }
};
