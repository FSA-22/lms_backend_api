import express from 'express';
import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment
} from '../controllers/assessment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const assessmentRouter = express.Router();

assessmentRouter.post(
  '/:slug/courses/:courseId/assessments',
  authenticate,
  authorize('INSTRUCTOR'),
  createAssessment
);

assessmentRouter.get(
  '/:slug/courses/:courseId/assessments',
  authenticate,
  authorize('INSTRUCTOR'),
  getAssessments
);

assessmentRouter.get(
  '/:slug/assessments/courses/:courseId/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR'),
  getAssessmentById
);

assessmentRouter.delete(
  '/:slug/assessments/courses/:courseId/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR'),
  deleteAssessment
);

assessmentRouter.put(
  '/:slug/assessments/courses/:courseId/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR'),
  updateAssessment
);

export default assessmentRouter;
