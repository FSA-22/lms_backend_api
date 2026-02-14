import { Router } from 'express';
import { login, registerTenant } from '../controllers/auth.controller.js';

const authRouter = Router();

authRouter.post('/register-org', registerTenant);
authRouter.post('/:slug/login', login);

export default authRouter;
