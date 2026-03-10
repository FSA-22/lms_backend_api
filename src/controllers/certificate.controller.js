import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

/** Utility to generate verification hash */
const generateVerificationHash = (payload) => {
  const secret = process.env.CERTIFICATE_SECRET;
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
};

/** 🔹 Issue certificate (Instructor/Admin/Superuser) */
export const issueCertificate = async (req, res, next) => {
  try {
    const { slug, courseId, userId: targetUserId } = req.params;
    const { tenantId, id: actorId, roles } = req.user;

    if (!slug || !courseId || !targetUserId) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const certificate = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validate tenant
      const tenant = await tx.tenant.findUnique({ where: { slug } });
      if (!tenant || tenant.id !== tenantId) throw new Error('INVALID_TENANT');

      // 2️⃣ Validate course
      const course = await tx.course.findFirst({
        where: { id: courseId, tenantId, deletedAt: null }
      });
      if (!course) throw new Error('COURSE_NOT_FOUND');

      // Instructor ownership enforcement
      if (roles.includes('INSTRUCTOR') && course.instructorId !== actorId) {
        throw new Error('NOT_COURSE_OWNER');
      }

      // 3️⃣ Validate enrollment
      const enrollment = await tx.enrollment.findFirst({
        where: { userId: targetUserId, courseId, tenantId, deletedAt: null }
      });
      if (!enrollment) throw new Error('NOT_ENROLLED');
      if (!enrollment.completedAt) throw new Error('COURSE_NOT_COMPLETED');

      // 4️⃣ Validate assessments
      if (course.hasFinalAssessment) {
        const passedAttempt = await tx.assessmentSubmission.findFirst({
          where: {
            userId: targetUserId,
            courseId,
            tenantId,
            score: { gte: course.passingScore ?? 0 }
          }
        });
        if (!passedAttempt) throw new Error('ASSESSMENT_NOT_PASSED');
      }

      // 5️⃣ Check idempotency
      const existingCertificate = await tx.certificate.findFirst({
        where: { userId: targetUserId, courseId, tenantId, status: 'ACTIVE' }
      });
      if (existingCertificate) return existingCertificate;

      // 6️⃣ Issue new certificate
      const certificateNo = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const issuedAt = new Date();
      const verificationHash = generateVerificationHash({
        userId: targetUserId,
        courseId,
        certificateNo,
        issuedAt: issuedAt.toISOString()
      });

      return tx.certificate.create({
        data: {
          tenantId,
          userId: targetUserId,
          courseId,
          certificateNo,
          verificationHash,
          issuedAt,
          issuedBy: actorId,
          status: 'ACTIVE'
        }
      });
    });

    return res
      .status(201)
      .json({ success: true, message: 'Certificate issued', data: certificate });
  } catch (error) {
    const errorMap = {
      INVALID_TENANT: [403, 'Invalid tenant access'],
      COURSE_NOT_FOUND: [404, 'Course not found'],
      NOT_COURSE_OWNER: [403, 'You are not the course owner'],
      NOT_ENROLLED: [404, 'User not enrolled in this course'],
      COURSE_NOT_COMPLETED: [400, 'Course not completed'],
      ASSESSMENT_NOT_PASSED: [400, 'Assessment not passed']
    };

    const [message] = errorMap[error.message] || [500, error.message || 'Internal server error'];
    // return res.status(status).json({ success: false, message });
    next(message);
  }
};

/** 🔹 Get all certificates of a user */
export const getUserCertificates = async (req, res, next) => {
  try {
    const { slug, userId } = req.params;
    const { tenantId } = req.user;

    // Verify tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.id !== tenantId) throw new Error('INVALID_TENANT');

    // Fetch certificates
    const certificates = await prisma.certificate.findMany({
      where: { userId, tenantId },
      include: {
        course: true, // include course details
        tenant: true, // optional: include tenant info
        user: true // include the certificate owner
      },
      orderBy: { issuedAt: 'desc' }
    });

    // Optionally, fetch issuedBy user manually
    const issuedByIds = [...new Set(certificates.map((c) => c.issuedBy))];
    const issuedByUsers = await prisma.user.findMany({
      where: { id: { in: issuedByIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    // Map issuedBy info to certificates
    const issuedByMap = Object.fromEntries(issuedByUsers.map((u) => [u.id, u]));
    const certificatesWithIssuer = certificates.map((c) => ({
      ...c,
      issuedByUser: issuedByMap[c.issuedBy] || null
    }));

    return res.json({
      success: true,
      count: certificatesWithIssuer.length,
      data: certificatesWithIssuer
    });
  } catch (error) {
    next(error);
  }
};
/** 🔹 Get all certificates for a course */
export const getCourseCertificates = async (req, res, next) => {
  try {
    const { slug, courseId } = req.params;
    const { tenantId } = req.user;

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.id !== tenantId) throw new Error('INVALID_TENANT');

    const certificates = await prisma.certificate.findMany({
      where: { courseId, tenantId },
      include: { user: true },
      orderBy: { issuedAt: 'desc' }
    });

    return res.json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Get single certificate by ID */
export const getSingleCertificate = async (req, res, next) => {
  try {
    const { slug, certificateId } = req.params;
    const { tenantId } = req.user;

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.id !== tenantId) throw new Error('INVALID_TENANT');

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { user: true, course: true, issuedByUser: true }
    });

    if (!certificate)
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    return res.json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

/** 🔹 Revoke certificate */
export const revokeCertificate = async (req, res, next) => {
  try {
    const { slug, certificateId } = req.params;
    const { tenantId, id: actorId, roles } = req.user;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res
        .status(400)
        .json({ success: false, message: 'Revocation reason required (min 5 chars)' });
    }

    if (!roles.includes('ADMIN') && !roles.includes('INSTRUCTOR')) {
      return res
        .status(403)
        .json({ success: false, message: 'Forbidden: insufficient permissions' });
    }

    const revokedCertificate = await prisma.$transaction(async (tx) => {
      const certificate = await tx.certificate.findFirst({
        where: { id: certificateId, tenantId },
        include: { course: { select: { instructorId: true } } }
      });

      if (!certificate) throw new Error('CERTIFICATE_NOT_FOUND');
      if (certificate.status === 'REVOKED') throw new Error('ALREADY_REVOKED');
      if (roles.includes('INSTRUCTOR') && certificate.course.instructorId !== actorId)
        throw new Error('NOT_COURSE_OWNER');

      return tx.certificate.update({
        where: { id: certificateId },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedBy: actorId,
          revokeReason: reason.trim()
        }
      });
    });

    return res
      .status(200)
      .json({ success: true, message: 'Certificate revoked', data: revokedCertificate });
  } catch (error) {
    const errorMap = {
      CERTIFICATE_NOT_FOUND: 404,
      ALREADY_REVOKED: 409,
      NOT_COURSE_OWNER: 403
    };

    const status = errorMap[error.message] || 500;
    return res
      .status(status)
      .json({ success: false, message: error.message || 'Internal server error' });
  }
};
