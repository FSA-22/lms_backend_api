import express, { Router } from 'express';
import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  getStudentAssessments
} from '../controllers/assessment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const assessmentRouter = Router();

// Instructor routes
assessmentRouter.post(
  '/:slug/courses/:courseId/assessments',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  createAssessment
);
assessmentRouter.get(
  '/:slug/courses/:courseId/assessments',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  getAssessments
);
assessmentRouter.get(
  '/:slug/assessments/courses/:courseId/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR'),
  getAssessmentById
);
assessmentRouter.put(
  '/:slug/assessments/courses/:courseId/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR'),
  updateAssessment
);
assessmentRouter.delete(
  '/:slug/assessments/courses/:courseId/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR'),
  deleteAssessment
);

// Student routes
assessmentRouter.get(
  '/:slug/student/courses/:courseId/assessments',
  authenticate,
  authorize('STUDENT'),
  getStudentAssessments
);

export default assessmentRouter;
