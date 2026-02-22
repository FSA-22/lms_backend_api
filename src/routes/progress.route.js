import express from 'express';
import { markLessonCompleted } from '../controllers/progress.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const progressRouter = express.Router();

progressRouter.post(
  '/lessons/:lessonId/progress',
  authenticate,
  authorize('STUDENT', 'SUPERUSER'),
  markLessonCompleted
);

export default progressRouter;
