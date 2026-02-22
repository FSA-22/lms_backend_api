import { Router } from 'express';
import { login, logout, registerTenant } from '../controllers/auth.controller.js';
import { registerInstructor, registerStudent } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const authRouter = Router();

authRouter.post('/register-org', registerTenant);
authRouter.post('/:slug/:role/login', login);

authRouter.post('/:slug/logout', authenticate, logout);

authRouter.post('/:slug/register/instructor', registerInstructor);
authRouter.post('/:slug/register/student', registerStudent);

export default authRouter;
