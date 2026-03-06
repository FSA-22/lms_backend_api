import { Router } from 'express';

import {
  createQuestion,
  getAssessmentQuestions,
  updateQuestion,
  deleteQuestion
} from '../controllers/assessmentQuestion.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const assessmentQuestionRouter = Router();

// ================= QUESTIONS =================

assessmentQuestionRouter.post(
  '/:slug/courses/:courseId/assessments/:assessmentId/questions',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  createQuestion
);

assessmentQuestionRouter.get(
  '/:slug/courses/:courseId/assessments/:assessmentId/questions',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'STUDENT'),
  getAssessmentQuestions
);

assessmentQuestionRouter.patch(
  '/:slug/courses/:courseId/assessments/:assessmentId/questions/:questionId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  updateQuestion
);

assessmentQuestionRouter.delete(
  '/:slug/courses/:courseId/assessments/:assessmentId/questions/:questionId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  deleteQuestion
);

export default assessmentQuestionRouter;
