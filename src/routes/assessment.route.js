import { Router } from 'express';
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

// Create a new assessment
assessmentRouter.post(
  '/:slug/courses/:courseId/assessments',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  createAssessment
);

// Get all assessments for a course
assessmentRouter.get(
  '/:slug/courses/:courseId/assessments',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  getAssessments
);

// Get a single assessment by ID
assessmentRouter.get(
  '/:slug/courses/:courseId/assessments/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  getAssessmentById
);

// Update an assessment
assessmentRouter.patch(
  '/:slug/courses/:courseId/assessments/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  updateAssessment
);

// Soft delete an assessment
assessmentRouter.delete(
  '/:slug/courses/:courseId/assessments/:assessmentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  deleteAssessment
);

// ================= STUDENT ROUTES =================

// Get all assessments a student can access (must complete all lessons)
assessmentRouter.get(
  '/:slug/courses/:courseId/student/assessments',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN'),
  getStudentAssessments
);

export default assessmentRouter;
