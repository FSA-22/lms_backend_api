import express from 'express';
import { markLessonCompleted } from '../controllers/progress.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const progressRouter = express.Router();

progressRouter.post(
  '/:slug/lessons/:lessonId/progress',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN'),
  markLessonCompleted
);

export default progressRouter;
