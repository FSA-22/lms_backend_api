import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getCurrentUser } from '../controllers/user.controller.js';

const userRouter = Router();

userRouter.get('/:slug/users', authenticate, getCurrentUser);

export default userRouter;
