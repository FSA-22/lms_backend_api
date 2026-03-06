import { Router } from 'express';
import {
  saveStudentAnswer,
  getMyAnswers,
  getAnswersByAssessment,
  getAnswersByStudent,
  updateStudentAnswer
} from '../controllers/studentAnswer.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const studentAnswerRouter = Router();

// ================= SAVE ANSWER =================

studentAnswerRouter.post(
  '/:slug/courses/:courseId/assessments/:assessmentId/questions/:questionId/answer',
  authenticate,
  authorize('STUDENT'),
  saveStudentAnswer
);

// ================= UPDATE ANSWER =================

studentAnswerRouter.patch(
  '/:slug/courses/:courseId/assessments/:assessmentId/questions/:questionId/answer',
  authenticate,
  authorize('STUDENT'),
  updateStudentAnswer
);

// ================= GET MY ANSWERS =================

studentAnswerRouter.get(
  '/:slug/courses/:courseId/assessments/:assessmentId/my-answers',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN'),
  getMyAnswers
);

// ================= INSTRUCTOR VIEW STUDENT ANSWERS =================

studentAnswerRouter.get(
  '/:slug/courses/:courseId/assessments/:assessmentId/answers',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  getAnswersByAssessment
);

// ================= VIEW SPECIFIC STUDENT ANSWERS =================

studentAnswerRouter.get(
  '/:slug/courses/:courseId/assessments/:assessmentId/students/:studentId/answers',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  getAnswersByStudent
);

export default studentAnswerRouter;
