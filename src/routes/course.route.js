import { Router } from 'express';

import { createCourse } from '../controllers/course.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const courseRouter = Router();

// All course routes require authentication
courseRouter.use(authenticate);

// Create a course (INSTRUCTOR only)
courseRouter.post('/', createCourse);

export default courseRouter;
