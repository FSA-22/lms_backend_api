import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getCurrentUser, getAllUsers } from '../controllers/user.controller.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { superUserLogin } from '../controllers/auth.controller.js';

const userRouter = Router();

userRouter.post('/superuser/login', superUserLogin);
userRouter.get('/:slug/me', authenticate, getCurrentUser);
userRouter.get('/:slug/users', authenticate, authorize('ADMIN', 'SUPERUSER'), getAllUsers);

export default userRouter;
getCurrentUser;
