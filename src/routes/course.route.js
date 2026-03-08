import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse
} from '../controllers/course.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const courseRouter = Router();

courseRouter.post('/:slug/courses', authenticate, authorize('INSTRUCTOR', 'ADMIN'), createCourse);

courseRouter.get(
  '/:slug/courses',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR', 'STUDENT', 'SUPERUSER'.toLowerCase()),
  getCourses
);

courseRouter.get(
  '/:slug/courses/:courseId',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR', 'STUDENT', 'SUPERUSER'),
  getCourseById
);

courseRouter.patch(
  '/:slug/courses/:courseId',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  updateCourse
);

courseRouter.delete(
  '/:slug/courses/:courseId',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  deleteCourse
);

export default courseRouter;
