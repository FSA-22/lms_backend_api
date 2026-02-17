import { Router } from 'express';
import { adminLogin, loginUser, logout, registerTenant } from '../controllers/auth.controller.js';
import { registerInstructor, registerStudent } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const authRouter = Router();

authRouter.post('/:slug/register-org', registerTenant);
authRouter.post('/:slug/admin/login', adminLogin);

authRouter.post('/:slug/logout', authenticate, logout);

authRouter.post('/:slug/register-instructor', registerInstructor);
authRouter.post('/:slug/register-student', registerStudent);
authRouter.post('/:slug/:role/login', loginUser);

export default authRouter;
