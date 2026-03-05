import { Router } from 'express';
import {
  createLesson,
  getLessonsByCourse,
  getLessonById,
  updateLesson,
  deleteLesson
} from '../controllers/lesson.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const lessonsRouter = Router();

/**
 * Create Lesson
 */
lessonsRouter.post(
  '/:slug/courses/:courseId/lessons',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  createLesson
);

/**
 * Get all lessons in course
 */
lessonsRouter.get(
  '/:slug/courses/:courseId/lessons',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getLessonsByCourse
);

/**
 * Get single lesson
 */
lessonsRouter.get(
  '/:slug/courses/:courseId/lessons/:lessonId',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getLessonById
);

/**
 * Update lesson
 */
lessonsRouter.patch(
  '/:slug/courses/:courseId/lessons/:lessonId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  updateLesson
);

/**
 * Soft delete lesson
 */
lessonsRouter.delete(
  '/:slug/courses/:courseId/lessons/:lessonId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  deleteLesson
);

export default lessonsRouter;
