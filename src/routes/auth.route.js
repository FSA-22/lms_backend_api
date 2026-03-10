import { Router } from 'express';

import {
  login,
  logout,
  refreshAccessToken,
  registerTenant,
  superUserLogin,
  registerInstructor,
  registerStudent
} from '../controllers/auth.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/limiter.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';

import {
  loginSchema,
  registerTenantSchema,
  registerInstructorSchema,
  registerStudentSchema,
  refreshTokenSchema
} from '../validators/auth.validator.js';

const authRouter = Router();

/*
| SUPERUSER AUTH
*/

authRouter.post('/superuser/login', authLimiter, validateRequest(loginSchema), superUserLogin);

/*
| ORGANIZATION REGISTRATION
*/

authRouter.post(
  '/register-org',
  authLimiter,
  validateRequest(registerTenantSchema),
  registerTenant
);

/*
| TENANT LOGIN
*/

authRouter.post('/:slug/login', authLimiter, validateRequest(loginSchema), login);

/*
| TENANT LOGOUT
*/

authRouter.post('/:slug/logout', authLimiter, authenticate, logout);

/*
| REGISTER INSTRUCTOR
*/

authRouter.post(
  '/:slug/register/instructor',
  authLimiter,
  validateRequest(registerInstructorSchema),
  registerInstructor
);

/*
| REGISTER STUDENT
*/

authRouter.post(
  '/:slug/register/student',
  authLimiter,
  validateRequest(registerStudentSchema),
  registerStudent
);

/*
| REFRESH ACCESS TOKEN
*/

authRouter.post(
  '/:slug/refresh',
  authLimiter,
  validateRequest(refreshTokenSchema),
  refreshAccessToken
);

export default authRouter;
