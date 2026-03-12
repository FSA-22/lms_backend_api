import { Router } from 'express';
import {
  createLesson,
  getLessonsByCourse,
  getLessonById,
  updateLesson,
  deleteLesson
} from '../controllers/lesson.controller.js';

import { validateRequest } from '../middlewares/validateRequest.middleware.js';

import {
  createLessonSchema,
  updateLessonSchema,
  getLessonByIdSchema,
  deleteLessonSchema,
  getLessonsByCourseSchema
} from '../validators/lesson.validator.js';

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
  validateRequest(createLessonSchema),
  createLesson
);

/**
 * Get all lessons in course
 */
lessonsRouter.get(
  '/:slug/courses/:courseId/lessons',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(getLessonsByCourseSchema),
  getLessonsByCourse
);
/**
 * Get single lesson
 */
lessonsRouter.get(
  '/:slug/courses/:courseId/lessons/:lessonId',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(getLessonByIdSchema),
  getLessonById
);

/**
 * Update lesson
 */
lessonsRouter.patch(
  '/:slug/courses/:courseId/lessons/:lessonId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(updateLessonSchema),
  updateLesson
);
/**
 * Soft delete lesson
 */
lessonsRouter.delete(
  '/:slug/courses/:courseId/lessons/:lessonId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(deleteLessonSchema),
  deleteLesson
);
export default lessonsRouter;
