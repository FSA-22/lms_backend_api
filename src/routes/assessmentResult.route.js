import { Router } from 'express';
import {
  getResultsByAssessment,
  getStudentResults,
  submitAssessmentResult
} from '../controllers/assessmentResult.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const assessmentResultRoute = Router();

// ------------------ STUDENT SUBMITS ASSESSMENT ------------------
assessmentResultRoute.post(
  '/:slug/assessments/:assessmentId/submit',
  authenticate,
  authorize('STUDENT'),
  submitAssessmentResult
);

// ------------------ INSTRUCTOR / ADMIN VIEWS ALL RESULTS ------------------
assessmentResultRoute.get(
  '/:slug/assessments/:assessmentId/results',
  authenticate,
  authorize('INSTRUCTOR', 'SUPERUSER', 'ADMIN'),
  getResultsByAssessment
);

// ------------------ STUDENT VIEWS OWN RESULTS ------------------
assessmentResultRoute.get(
  '/:slug/students/:studentId/results',
  authenticate,
  authorize('STUDENT'),
  getStudentResults
);

export default assessmentResultRoute;
