import { Router } from 'express';
import { markLessonCompleted } from '../controllers/progress.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const progressRouter = Router();

progressRouter.post(
  '/:slug/progress/:lessonId',
  authenticate,
  authorize('STUDENT', 'SUPERUSER'.toLowerCase()),
  markLessonCompleted
);

export default progressRouter;
