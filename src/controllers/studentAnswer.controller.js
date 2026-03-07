import { prisma } from '../lib/prisma.js';

export const saveStudentAnswer = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { questionId } = req.params;
    const { selectedOptionId, textAnswer } = req.body;

    const question = await prisma.question.findFirst({
      where: { id: questionId, tenantId },
      include: { options: true }
    });

    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const existing = await prisma.studentAnswer.findUnique({
      where: {
        questionId_userId: { questionId, userId }
      }
    });

    if (existing)
      return res
        .status(409)
        .json({ success: false, message: 'Answer already submitted for this question' });

    let isCorrect = null;
    let score = 0;

    if (question.type === 'MCQ') {
      const correct = question.options.find((o) => o.isCorrect);

      if (selectedOptionId === correct?.id) {
        isCorrect = true;
        score = question.marks;
      } else {
        isCorrect = false;
      }
    }

    const answer = await prisma.studentAnswer.create({
      data: {
        tenantId,
        questionId,
        userId,
        selectedOptionId,
        textAnswer,
        isCorrect,
        score
      }
    });

    res.status(201).json({
      success: true,
      message: 'Answer saved successfully',
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentAnswer = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { questionId } = req.params;
    const { selectedOptionId, textAnswer } = req.body;

    const answer = await prisma.studentAnswer.findUnique({
      where: {
        questionId_userId: { questionId, userId }
      },
      include: { question: { include: { options: true } } }
    });

    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

    let isCorrect = null;
    let score = 0;

    if (answer.question.type === 'MCQ') {
      const correct = answer.question.options.find((o) => o.isCorrect);

      if (selectedOptionId === correct?.id) {
        isCorrect = true;
        score = answer.question.marks;
      } else {
        isCorrect = false;
      }
    }

    const updated = await prisma.studentAnswer.update({
      where: { id: answer.id },
      data: {
        selectedOptionId,
        textAnswer,
        isCorrect,
        score
      }
    });

    res.json({
      success: true,
      message: 'Answer updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAnswers = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { assessmentId } = req.params;

    const answers = await prisma.studentAnswer.findMany({
      where: {
        tenantId,
        userId,
        question: { assessmentId }
      },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            marks: true
          }
        }
      }
    });

    res.json({
      success: true,
      count: answers.length,
      data: answers
    });
  } catch (error) {
    next(error);
  }
};

export const getAnswersByAssessment = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { assessmentId } = req.params;

    const answers = await prisma.studentAnswer.findMany({
      where: {
        tenantId,
        question: { assessmentId }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      count: answers.length,
      data: answers
    });
  } catch (error) {
    next(error);
  }
};

export const getAnswersByStudent = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { assessmentId, studentId } = req.params;

    const answers = await prisma.studentAnswer.findMany({
      where: {
        tenantId,
        userId: studentId,
        question: { assessmentId }
      },
      include: {
        question: true
      }
    });

    res.json({
      success: true,
      count: answers.length,
      data: answers
    });
  } catch (error) {
    next(error);
  }
};
