import { Router } from 'express';
import {
  getResultsByAssessment,
  getStudentResults,
  submitAssessmentResult
} from '../controllers/assessmentResult.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const assessmentResultRoute = Router();

//  Student submits their assessment
assessmentResultRoute.post(
  '/:slug/assessments/:assessmentId/submit',
  authenticate,
  authorize('STUDENT'),
  submitAssessmentResult
);

//  Instructor views all results for a specific assessment
assessmentResultRoute.get(
  '/:slug/assessments/:assessmentId/results',
  authenticate,
  authorize('INSTRUCTOR'),
  getResultsByAssessment
);

//  Student views their own results
assessmentResultRoute.get(
  '/:slug/students/:studentId/results',
  authenticate,
  authorize('STUDENT'),
  getStudentResults
);

export default assessmentResultRoute;
