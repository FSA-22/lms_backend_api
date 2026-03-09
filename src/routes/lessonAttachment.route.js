import { Router } from 'express';
import {
  addLessonAttachment,
  getLessonAttachments,
  deleteLessonAttachment,
  updateLessonAttachment
} from '../controllers/lessonAttachment.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const lessonAttachmentRouter = Router();

lessonAttachmentRouter.post(
  '/:slug/lessons/:lessonId/attachments',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  addLessonAttachment
);

lessonAttachmentRouter.get(
  '/:slug/lessons/:lessonId/attachments',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getLessonAttachments
);

lessonAttachmentRouter.patch(
  '/:slug/lessons/:lessonId/attachments/:attachmentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  updateLessonAttachment
);

lessonAttachmentRouter.delete(
  '/:slug/lessons/:lessonId/attachments/:attachmentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  deleteLessonAttachment
);

export default lessonAttachmentRouter;
