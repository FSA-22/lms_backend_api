import * as certificateService from '../services/certificate.service.js';

import { prisma } from '../lib/prisma.js';

/**
 * Instructor issues certificate
 * Conditions:
 *  - Student completed course
 *  - Student passed required assessment
 */
import { prisma } from '../lib/prisma.js';

/**
 * POST /courses/:courseId/certificates/:userId
 */
export const issueCertificateController = async (req, res) => {
  const { id: actorId, tenantId, role } = req.user;
  const { courseId, userId } = req.params;

  if (!courseId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'courseId and userId are required'
    });
  }

  if (!['INSTRUCTOR', 'ADMIN'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: insufficient permissions'
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validate course (tenant-safe)
      const course = await tx.course.findFirst({
        where: { id: courseId, tenantId }
      });

      if (!course) {
        throw new Error('COURSE_NOT_FOUND');
      }

      // Instructor ownership
      if (role === 'INSTRUCTOR' && course.instructorId !== actorId) {
        throw new Error('NOT_COURSE_OWNER');
      }

      // 2️⃣ Validate enrollment
      const enrollment = await tx.enrollment.findFirst({
        where: { userId, courseId, tenantId }
      });

      if (!enrollment) {
        throw new Error('NOT_ENROLLED');
      }

      if (!enrollment.completedAt) {
        throw new Error('COURSE_NOT_COMPLETED');
      }

      // 3️⃣ Validate assessment pass (if required)
      if (course.hasFinalAssessment) {
        const passedAttempt = await tx.assessmentSubmission.findFirst({
          where: {
            userId,
            courseId,
            tenantId,
            score: { gte: course.passingScore ?? 0 }
          }
        });

        if (!passedAttempt) {
          throw new Error('ASSESSMENT_NOT_PASSED');
        }
      }

      // 4️⃣ Duplicate protection (relies on DB unique constraint)
      const certificate = await tx.certificate.create({
        data: {
          tenantId,
          userId,
          courseId,
          issuedBy: actorId,
          issuedAt: new Date()
        }
      });

      return certificate;
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: result
    });
  } catch (error) {
    // Unique constraint fallback safety
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Certificate already exists'
      });
    }

    const errorMap = {
      COURSE_NOT_FOUND: 404,
      NOT_COURSE_OWNER: 403,
      NOT_ENROLLED: 404,
      COURSE_NOT_COMPLETED: 400,
      ASSESSMENT_NOT_PASSED: 400
    };

    const status = errorMap[error.message] || 500;

    return res.status(status).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const getUserCertificatesController = async (req, res) => {
  const { tenantId } = req.user;
  const { userId } = req.params;

  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId, tenantId },
      include: {
        course: true,
        issuedByUser: true
      },
      orderBy: { issuedAt: 'desc' }
    });

    return res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getCourseCertificatesController = async (req, res) => {
  const { tenantId } = req.user;
  const { courseId } = req.params;

  try {
    const certificates = await prisma.certificate.findMany({
      where: { courseId, tenantId },
      include: {
        user: true
      },
      orderBy: { issuedAt: 'desc' }
    });

    return res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSingleCertificateController = async (req, res) => {
  const { tenantId } = req.user;
  const { certificateId } = req.params;

  try {
    const certificate = await prisma.certificate.findFirst({
      where: {
        id: certificateId,
        tenantId
      },
      include: {
        user: true,
        course: true,
        issuedByUser: true
      }
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    return res.json({
      success: true,
      data: certificate
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

import { prisma } from '../lib/prisma.js';

/**
 * Requirements:
 * - Role: INSTRUCTOR (must own course) or ADMIN
 * - Certificate must belong to tenant
 * - Must not already be revoked
 * - Revocation reason required
 */
export const revokeCertificateController = async (req, res) => {
  const { id: actorId, tenantId, role } = req.user;
  const { certificateId } = req.params;
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Valid revocation reason (min 5 characters) is required'
    });
  }

  if (!['INSTRUCTOR', 'ADMIN'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: insufficient permissions'
    });
  }

  try {
    const revokedCertificate = await prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch certificate (tenant isolated)
      const certificate = await tx.certificate.findFirst({
        where: {
          id: certificateId,
          tenantId
        },
        include: {
          course: {
            select: { instructorId: true }
          }
        }
      });

      if (!certificate) {
        throw new Error('CERTIFICATE_NOT_FOUND');
      }

      // 2️⃣ Idempotency protection
      if (certificate.status === 'REVOKED') {
        throw new Error('ALREADY_REVOKED');
      }

      // 3️⃣ Instructor ownership enforcement
      if (role === 'INSTRUCTOR' && certificate.course.instructorId !== actorId) {
        throw new Error('NOT_COURSE_OWNER');
      }

      // 4️⃣ Perform revocation
      const updated = await tx.certificate.update({
        where: { id: certificateId },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedBy: actorId,
          revokeReason: reason.trim()
        }
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: revokedCertificate
    });
  } catch (error) {
    const errorMap = {
      CERTIFICATE_NOT_FOUND: 404,
      ALREADY_REVOKED: 409,
      NOT_COURSE_OWNER: 403
    };

    const statusCode = errorMap[error.message] || 500;

    return res.status(statusCode).json({
      success: false,
      message: errorMap[error.message] ? error.message : 'Internal server error'
    });
  }
};
