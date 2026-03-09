import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { courseEnrollment, getEnrollments } from '../controllers/enrollment.controller.js';

const enrollRouter = Router();

/**
 * Enroll in a course (STUDENT only)
 */
enrollRouter.post(
  '/:slug/courses/:courseId/enrollments',
  authenticate,
  authorize('STUDENT'),
  courseEnrollment
);

/**
 * Get enrollments for a course (INSTRUCTOR / ADMIN / SUPERUSER)
 */
enrollRouter.get(
  '/:slug/courses/:courseId/enrollments',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getEnrollments
);

export default enrollRouter;
