import { Router } from 'express';
import { markLessonProgress } from '../controllers/progress.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const progressRouter = Router();

progressRouter.post(
  '/:slug/progress/lesson/:lessonId',
  authenticate,
  authorize('STUDENT', 'SUPERUSER'.toLowerCase()),
  markLessonCompleted
);

export default progressRouter;
