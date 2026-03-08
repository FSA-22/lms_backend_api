import { Router } from 'express';
import {
  createLessonContent,
  getLessonContents,
  updateLessonContent,
  deleteLessonContent
} from '../controllers/lessonContent.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const lessonContentRouter = Router();

lessonContentRouter.post(
  '/:slug/lessons/:lessonId/contents',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  createLessonContent
);

lessonContentRouter.get(
  '/:slug/lessons/:lessonId/contents',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getLessonContents
);

lessonContentRouter.patch(
  '/:slug/contents/:contentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  updateLessonContent
);

lessonContentRouter.delete(
  '/:slug/contents/:contentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  deleteLessonContent
);

export default lessonContentRouter;
