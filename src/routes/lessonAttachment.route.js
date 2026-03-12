import { Router } from 'express';
import {
  addLessonAttachment,
  getLessonAttachments,
  deleteLessonAttachment,
  updateLessonAttachment
} from '../controllers/lessonAttachment.controller.js';

import {
  addLessonAttachmentSchema,
  getLessonAttachmentsSchema,
  updateLessonAttachmentSchema,
  deleteLessonAttachmentSchema
} from '../validators/lessonAttachment.validator.js';

import { validateRequest } from '../middlewares/validateRequest.middleware.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const lessonAttachmentRouter = Router();

lessonAttachmentRouter.post(
  '/:slug/lessons/:lessonId/attachments',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(addLessonAttachmentSchema),
  addLessonAttachment
);

lessonAttachmentRouter.get(
  '/:slug/lessons/:lessonId/attachments',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(getLessonAttachmentsSchema),
  getLessonAttachments
);

lessonAttachmentRouter.patch(
  '/:slug/lessons/:lessonId/attachments/:attachmentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(updateLessonAttachmentSchema),
  updateLessonAttachment
);

lessonAttachmentRouter.delete(
  '/:slug/lessons/:lessonId/attachments/:attachmentId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  validateRequest(deleteLessonAttachmentSchema),
  deleteLessonAttachment
);

export default lessonAttachmentRouter;
