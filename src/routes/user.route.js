import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getCurrentUser, getAllUsers } from '../controllers/user.controller.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const userRouter = Router();

userRouter.get('/:slug/me', authenticate, getCurrentUser);
userRouter.get('/:slug/users', authenticate, authorize('ADMIN'), getAllUsers);

export default userRouter;
getCurrentUser;
