import { prisma } from '../lib/prisma.js';

export const createQuestion = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { assessmentId } = req.params;
    const { question, type, marks, options } = req.body;

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, tenantId, deletedAt: null },
      include: { course: true }
    });

    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (assessment.course.instructorId !== userId)
      return res.status(403).json({ message: 'Not allowed to add questions' });

    const newQuestion = await prisma.question.create({
      data: {
        tenantId,
        assessmentId,
        question,
        type,
        marks,
        options: options
          ? {
              create: options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect
              }))
            }
          : undefined
      },
      include: { options: true }
    });

    res.status(201).json({ success: true, data: newQuestion });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentQuestions = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { assessmentId } = req.params;

    const questions = await prisma.question.findMany({
      where: { assessmentId, tenantId },
      include: {
        options: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });

    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { questionId } = req.params;
    const { question, marks } = req.body;

    const existing = await prisma.question.findFirst({
      where: { id: questionId, tenantId }
    });

    if (!existing) return res.status(404).json({ message: 'Question not found' });

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { question, marks }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { questionId } = req.params;

    const question = await prisma.question.findFirst({
      where: { id: questionId, tenantId }
    });

    if (!question) return res.status(404).json({ message: 'Question not found' });

    await prisma.question.delete({
      where: { id: questionId }
    });

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};
