import { Router } from 'express';
import {
  issueCertificate,
  getUserCertificates,
  getCourseCertificates,
  getSingleCertificate,
  revokeCertificate
} from '../controllers/certificate.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const certificateRouter = Router();

/**
 * Issue certificate (Instructor/Admin only)
 */
certificateRouter.post(
  '/:slug/courses/:courseId/certificates/:userId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  issueCertificate
);

/**
 * Get all certificates of a user
 */
certificateRouter.get(
  '/:slug/users/:userId/certificates',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getUserCertificates
);

/**
 * Get all certificates issued for a course
 */
certificateRouter.get(
  '/:slug/courses/:courseId/certificates',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getCourseCertificates
);

/**
 * Get single certificate by ID
 */
certificateRouter.get(
  '/:slug/certificates/:certificateId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'STUDENT', 'SUPERUSER'),
  getSingleCertificate
);

/**
 * Revoke a certificate
 */
certificateRouter.patch(
  '/:slug/certificates/:certificateId/revoke',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  revokeCertificate
);

export default certificateRouter;
