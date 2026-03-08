import { Router } from 'express';
import {
  login,
  logout,
  refreshAccessToken,
  registerTenant
} from '../controllers/auth.controller.js';
import { registerInstructor, registerStudent } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/limiter.middleware.js';

const authRouter = Router();

authRouter.post('/register-org', authLimiter, registerTenant);

authRouter.post('/:slug/login', authLimiter, login);

authRouter.post('/:slug/logout', authLimiter, authenticate, logout);

authRouter.post('/:slug/register/instructor', authLimiter, registerInstructor);

authRouter.post('/:slug/register/student', authLimiter, registerStudent);

authRouter.post('/:slug/refresh', authLimiter, refreshAccessToken);

export default authRouter;
