import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser
} from '../controllers/user.controller.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { superUserLogin } from '../controllers/auth.controller.js';

const userRouter = Router();

userRouter.post('/superuser/login', superUserLogin);

userRouter.get('/:slug/me', authenticate, getCurrentUser);

userRouter.get('/:slug/users', authenticate, authorize('ADMIN', 'SUPERUSER'), getAllUsers);

userRouter.get('/:slug/users/:id', authenticate, authorize('ADMIN', 'SUPERUSER'), getUserById);

userRouter.patch('/:slug/users/:id', authenticate, authorize('ADMIN', 'SUPERUSER'), updateUser);

userRouter.delete(
  '/:slug/users/:id',
  authenticate,
  authorize('ADMIN', 'SUPERUSER'),
  deactivateUser
);

export default userRouter;
