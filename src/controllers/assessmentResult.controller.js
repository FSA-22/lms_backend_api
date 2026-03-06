import { prisma } from '../lib/prisma.js';

// export const submitAssessment = async (req, res, next) => {
//   try {
//     const { tenantId, id: userId } = req.user;
//     const { assessmentId } = req.params;
//     const { answers } = req.body;

//     const questions = await prisma.question.findMany({
//       where: { assessmentId, tenantId },
//       include: { options: true }
//     });

//     let totalScore = 0;
//     let maxScore = 0;

//     const studentAnswers = [];

//     for (const question of questions) {
//       maxScore += question.marks;

//       const submitted = answers.find((a) => a.questionId === question.id);
//       if (!submitted) continue;

//       let isCorrect = null;
//       let score = 0;

//       if (question.type === 'MCQ') {
//         const correct = question.options.find((o) => o.isCorrect);

//         if (submitted.selectedOptionId === correct?.id) {
//           isCorrect = true;
//           score = question.marks;
//         } else {
//           isCorrect = false;
//         }
//       }

//       totalScore += score;

//       studentAnswers.push({
//         tenantId,
//         questionId: question.id,
//         userId,
//         selectedOptionId: submitted.selectedOptionId,
//         textAnswer: submitted.textAnswer,
//         isCorrect,
//         score
//       });
//     }

//     await prisma.studentAnswer.createMany({
//       data: studentAnswers
//     });

//     const passMark = maxScore * 0.5;

//     const result = await prisma.assessmentResult.create({
//       data: {
//         tenantId,
//         assessmentId,
//         userId,
//         score: totalScore,
//         passed: totalScore >= passMark
//       }
//     });

//     res.json({
//       success: true,
//       message: 'Assessment submitted successfully',
//       result
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getMyAssessmentResult = async (req, res, next) => {
//   try {
//     const { id: userId } = req.user;
//     const { assessmentId } = req.params;

//     const result = await prisma.assessmentResult.findUnique({
//       where: {
//         assessmentId_userId: {
//           assessmentId,
//           userId
//         }
//       }
//     });

//     res.json({ success: true, data: result });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getAssessmentResults = async (req, res, next) => {
//   try {
//     const { assessmentId } = req.params;

//     const results = await prisma.assessmentResult.findMany({
//       where: { assessmentId, deletedAt: null },
//       include: {
//         user: {
//           select: { id: true, name: true, email: true }
//         }
//       },
//       orderBy: { score: 'desc' }
//     });

//     res.json({ success: true, data: results });
//   } catch (error) {
//     next(error);
//   }
// };

// ---------------- GET RESULTS BY ASSESSMENT (INSTRUCTOR) ----------------

export const getResultsByAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { tenantId, id: userId } = req.user;

    if (!assessmentId) return res.status(400).json({ message: 'Assessment ID is required' });

    // Validate assessment belongs to instructor
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        tenantId,
        deletedAt: null,
        course: { instructorId: userId, deletedAt: null }
      },
      include: { course: true }
    });
    if (!assessment)
      return res.status(404).json({ message: 'Assessment not found or not owned by instructor' });

    const results = await prisma.assessmentResult.findMany({
      where: { assessmentId, tenantId, deletedAt: null },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { submittedAt: 'desc' }
    });

    return res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

// ---------------- GET STUDENT RESULTS ----------------
export const getStudentResults = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { tenantId, id: userId, roles } = req.user;

    // Only allow student to view own results
    if (roles.includes('STUDENT') && userId !== studentId) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot view other student's results" });
    }

    const results = await prisma.assessmentResult.findMany({
      where: { userId: studentId, tenantId, deletedAt: null },
      include: { assessment: true },
      orderBy: { submittedAt: 'desc' }
    });

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

// ---------------- SUBMIT ASSESSMENT RESULT ----------------
export const submitAssessmentResult = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { score } = req.body;
    const { tenantId, id: userId } = req.user;

    if (!assessmentId) return res.status(400).json({ message: 'Assessment ID is required' });
    if (typeof score !== 'number')
      return res.status(400).json({ message: 'Score must be a number' });

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validate assessment exists
      const assessment = await tx.assessment.findFirst({
        where: { id: assessmentId, tenantId, deletedAt: null },
        include: { course: true }
      });
      if (!assessment) throw new Error('Assessment not found');

      // 2️⃣ Ensure student completed all lessons first
      const totalLessons = await tx.lesson.count({
        where: { courseId: assessment.courseId, tenantId, deletedAt: null }
      });
      const completedLessons = await tx.progress.count({
        where: { userId, courseId: assessment.courseId, tenantId, completed: true, deletedAt: null }
      });

      if (totalLessons > 0 && completedLessons !== totalLessons) {
        throw new Error('Complete all lessons before submitting assessment');
      }

      // 3️⃣ Validate enrollment
      const enrolled = await tx.enrollment.findFirst({
        where: { userId, courseId: assessment.courseId, deletedAt: null }
      });
      if (!enrolled) throw new Error('Student not enrolled in course');

      // 4️⃣ Idempotency: check if already submitted
      const existing = await tx.assessmentResult.findUnique({
        where: { assessmentId_userId: { assessmentId, userId } }
      });
      if (existing && !existing.deletedAt) throw new Error('Assessment already submitted');

      // 5️⃣ Validate score
      if (score < 0 || score > assessment.totalMarks) throw new Error('Invalid score value');

      // 6️⃣ Create assessment result
      return tx.assessmentResult.create({
        data: {
          tenantId,
          assessmentId,
          userId,
          score,
          passed: score >= assessment.totalMarks * 0.5
        }
      });
    });

    res
      .status(201)
      .json({ success: true, message: 'Assessment submitted successfully', data: result });
  } catch (error) {
    if (error.message.includes('Complete all lessons')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('Assessment already submitted')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (
      error.message.includes('Assessment not found') ||
      error.message.includes('Student not enrolled')
    ) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};
