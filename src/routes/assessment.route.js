import express from 'express';
import { submitAssessment } from '../controllers/assessment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const assessmentRouter = express.Router();

assessmentRouter.post(
  '/:slug/assessment/:assessment/submit',
  authenticate,
  authorize('STUDENT'),
  submitAssessment
);

export default assessmentRouter;
