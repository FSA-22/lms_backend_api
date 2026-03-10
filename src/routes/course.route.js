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
import { validateRequest } from '../middlewares/validateRequest.middleware.js';

import {
  createCourseSchema,
  updateCourseSchema,
  getCourseByIdSchema,
  deleteCourseSchema,
  getCoursesSchema
} from '../validators/course.validator.js';

const courseRouter = Router();

/*
| CREATE COURSE
*/

courseRouter.post(
  '/:slug/courses',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  validateRequest(createCourseSchema),
  createCourse
);

/*
| GET COURSES
*/

courseRouter.get(
  '/:slug/courses',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR', 'STUDENT', 'SUPERUSER'),
  validateRequest(getCoursesSchema),
  getCourses
);

/*
| GET COURSE BY ID
*/

courseRouter.get(
  '/:slug/courses/:courseId',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR', 'STUDENT', 'SUPERUSER'),
  validateRequest(getCourseByIdSchema),
  getCourseById
);

/*
| UPDATE COURSE
*/

courseRouter.patch(
  '/:slug/courses/:courseId',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  validateRequest(updateCourseSchema),
  updateCourse
);

/*
| DELETE COURSE
*/

courseRouter.delete(
  '/:slug/courses/:courseId',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  validateRequest(deleteCourseSchema),
  deleteCourse
);

export default courseRouter;
