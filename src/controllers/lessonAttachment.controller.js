import { prisma } from '../lib/prisma.js';

export const addLessonAttachment = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { fileName, fileUrl, fileSize } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        tenantId,
        deletedAt: null
      },
      include: { course: true }
    });

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (lesson.course.instructorId !== userId)
      return res.status(403).json({ message: 'Not allowed' });

    const attachment = await prisma.lessonAttachment.create({
      data: {
        lessonId,
        fileName,
        fileUrl,
        fileSize
      }
    });

    res.status(201).json({
      message: 'Attachment added',
      attachment
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonAttachments = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const files = await prisma.lessonAttachment.findMany({
      where: { lessonId }
    });

    res.status(200).json(files);
  } catch (error) {
    next(error);
  }
};

export const updateLessonAttachment = async (req, res, next) => {
  try {
    const { lessonId, attachmentId } = req.params;
    const { fileName, fileUrl, fileSize } = req.body;

    const tenantId = req.user.tenantId;

    const attachment = await prisma.lessonAttachment.findFirst({
      where: {
        id: attachmentId,
        lessonId,
        lesson: {
          tenantId,
          deletedAt: null
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({
        message: 'Attachment not found'
      });
    }

    const updatedAttachment = await prisma.lessonAttachment.update({
      where: { id: attachmentId },
      data: {
        fileName: fileName ?? attachment.fileName,
        fileUrl: fileUrl ?? attachment.fileUrl,
        fileSize: fileSize ?? attachment.fileSize
      }
    });

    res.status(200).json({
      message: 'Attachment updated',
      attachment: updatedAttachment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLessonAttachment = async (req, res, next) => {
  try {
    const { lessonId, attachmentId } = req.params;
    const tenantId = req.user.tenantId;

    const attachment = await prisma.lessonAttachment.findFirst({
      where: {
        id: attachmentId,
        lessonId,
        lesson: {
          tenantId,
          deletedAt: null
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({
        message: 'Attachment not found'
      });
    }

    await prisma.lessonAttachment.delete({
      where: { id: attachmentId }
    });

    res.status(200).json({
      message: 'Attachment deleted'
    });
  } catch (error) {
    next(error);
  }
};
