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

export const getAssessmentQuestionsForStudent = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }

    //  Validate assessment
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        deletedAt: null
      },
      include: {
        course: true
      }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // 2️⃣ Ensure student is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: assessment.courseId,
        deletedAt: null
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // 3️⃣ Ensure lessons are completed before assessment
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({
        where: {
          courseId: assessment.courseId,
          tenantId,
          deletedAt: null
        }
      }),

      prisma.progress.count({
        where: {
          userId,
          courseId: assessment.courseId,
          tenantId,
          completed: true,
          deletedAt: null
        }
      })
    ]);

    if (totalLessons > 0 && completedLessons !== totalLessons) {
      return res.status(403).json({
        success: false,
        message: 'Complete all lessons before taking the assessment'
      });
    }

    // 4️⃣ Prevent access if assessment already submitted
    const existingResult = await prisma.assessmentResult.findUnique({
      where: {
        assessmentId_userId: {
          assessmentId,
          userId
        }
      }
    });

    if (existingResult && !existingResult.deletedAt) {
      return res.status(409).json({
        success: false,
        message: 'Assessment already submitted'
      });
    }

    // 5️⃣ Get questions
    const questions = await prisma.question.findMany({
      where: {
        assessmentId,
        tenantId
      },
      include: {
        options: {
          select: {
            id: true,
            text: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 6️⃣ Get existing answers (for resume functionality)
    const answers = await prisma.studentAnswer.findMany({
      where: {
        tenantId,
        userId,
        question: {
          assessmentId
        }
      }
    });

    const answersMap = new Map(answers.map((a) => [a.questionId, a]));

    // 7️⃣ Attach student's saved answers to questions
    const formattedQuestions = questions.map((q) => {
      const studentAnswer = answersMap.get(q.id);

      return {
        id: q.id,
        question: q.question,
        type: q.type,
        marks: q.marks,

        options: q.options,

        studentAnswer: studentAnswer
          ? {
              selectedOptionId: studentAnswer.selectedOptionId,
              textAnswer: studentAnswer.textAnswer
            }
          : null
      };
    });

    res.json({
      success: true,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        totalMarks: assessment.totalMarks
      },
      questionCount: formattedQuestions.length,
      data: formattedQuestions
    });
  } catch (error) {
    next(error);
  }
};
