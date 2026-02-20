import express from 'express';

import { createLesson } from '../controllers/lesson.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const lessonsRouter = express.Router();

lessonsRouter.post('/:slug/lessons', authenticate, authorize('STUDENT'), createLesson);

export default lessonsRouter;
