import { Router } from 'express';

import { createCourse, getCourses } from '../controllers/course.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const courseRouter = Router();

// Create a course (INSTRUCTOR only)
courseRouter.post('/:slug/courses', authenticate, authorize('INSTRUCTOR', 'SUPERUSER'), createCourse);

courseRouter.get(
  '/:slug/courses',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR', 'STUDENT', 'SUPERUSER'),
  getCourses
);

export default courseRouter;
