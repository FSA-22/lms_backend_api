import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { courseEnrollment } from '../controllers/enrollment.controller.js';

const enrollRouter = Router();

// Create a course (INSTRUCTOR only)
enrollRouter.post(
  '/:slug/courses/:courseId/enrollments',
  authenticate,
  authorize('STUDENT'),
  courseEnrollment
);

export default enrollRouter;
