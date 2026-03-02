import { Router } from 'express';
import {
  getDashboardOverview,
  getUserStats,
  listUsers,
  updateUserRole,
  listCourses,
  approveCourse,
  getEnrollmentStats,
  listCertificates,
  getAuditLogs,
  updateTenantSettings
} from '../controllers/admin.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const adminRouter = Router();

adminRouter.get('/:slug/overview', authenticate, authorize('ADMIN'), getDashboardOverview);
adminRouter.get('/:slug/stats/users', authenticate, authorize('ADMIN'), getUserStats);

adminRouter.get('/:slug/users', authenticate, authorize('ADMIN'), listUsers);
adminRouter.patch('/:slug/users/:userId', authenticate, authorize('ADMIN'), updateUserRole);

adminRouter.get('/:slug/courses', authenticate, listCourses);

adminRouter.patch(
  '/:slug/courses/:courseId/approve',
  authenticate,
  authorize('ADMIN'),
  approveCourse
);

adminRouter.get('/:slug/stats/enrollments', authenticate, authorize('ADMIN'), getEnrollmentStats);

adminRouter.get('/:slug/certificates', authenticate, authorize('ADMIN'), listCertificates);

adminRouter.get('/:slug/audit-logs', authenticate, authorize('ADMIN'), getAuditLogs);

adminRouter.patch('/:slug/settings', authorize('ADMIN'), updateTenantSettings);

export default adminRouter;
