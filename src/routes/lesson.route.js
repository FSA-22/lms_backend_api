import express from 'express';
import {
  createLesson,
  getLessonsByCourse,
  getLessonById,
  updateLesson,
  deleteLesson
} from '../controllers/lesson.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const lessonsRouter = express.Router();

/**
 * Instructor creates lesson
 */
lessonsRouter.post(
  '/:slug/courses/:courseId/lessons',
  authenticate,
  authorize('INSTRUCTOR'),
  createLesson
);

/**
 * Fetch lessons in a course (students + instructors)
 */
lessonsRouter.get(
  '/:slug/courses/:courseId/lessons',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR'),
  getLessonsByCourse
);

/**
 * Get single lesson
 */
lessonsRouter.get(
  '/:slug/lessons/:lessonId',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR'),
  getLessonById
);

/**
 * Update lesson (instructor only)
 */
lessonsRouter.put('/:slug/lessons/:lessonId', authenticate, authorize('INSTRUCTOR'), updateLesson);

/**
 * Soft delete lesson
 */
lessonsRouter.delete(
  '/:slug/lessons/:lessonId',
  authenticate,
  authorize('INSTRUCTOR'),
  deleteLesson
);

export default lessonsRouter;
