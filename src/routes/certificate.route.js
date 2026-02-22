import express from 'express';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

import {
  issueCertificateController,
  getUserCertificatesController,
  getCourseCertificatesController,
  getSingleCertificateController
} from '../controllers/certificate.controller.js';

const certificateRouter = express.Router();

/**
 * Issue certificate (Instructor/Admin only)
 */
certificateRouter.post(
  '/:slug/courses/:courseId/certificates/:userId',
  authenticate,

  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  issueCertificateController
);

/**
 * Get all certificates of a user
 */
certificateRouter.get(
  '/:slug/users/:userId/certificates',
  authenticate,

  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getUserCertificatesController
);

/**
 * Get all certificates issued for a course
 */
certificateRouter.get(
  '/:slug/courses/:courseId/certificates',
  authenticate,

  authorize('INSTRUCTOR', 'ADMIN', 'SUPERUSER'),
  getCourseCertificatesController
);

/**
 * Get single certificate by ID
 */
certificateRouter.get(
  '/:slug/certificates/:certificateId',
  authenticate,

  authorize('INSTRUCTOR', 'ADMIN', 'STUDENT', 'SUPERUSER'),

  getSingleCertificateController
);

/**
 * Patch (revoke) single certificate by ID
 */

certificateRouter.patch(
  '/:slug/certificates/:certificateId/revoke',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'STUDENT', 'SUPERUSER'),

  getCourseCertificatesController
);

export default certificateRouter;
