/**
 * Instructor issues certificate
 * Conditions:
 *  - Student completed course
 *  - Student passed required assessment
 */

// export const issueCertificateController = async (req, res) => {
//   const { id: actorId, tenantId, roles } = req.user;
//   const role = roles?.[0];

//   const { courseId, userId } = req.params;

//   console.log(
//     `Issuing certificate for user ${userId} in course ${courseId} by actor ${actorId} with role ${role}`
//   );

//   console.log('Validating course:', { courseId, tenantId });

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       //  Validate course (tenant-safe)
//       const course = await tx.course.findFirst({
//         where: {
//           id: courseId,
//           tenantId
//         }
//       });

//       if (!course) {
//         throw new Error('COURSE_NOT_FOUND');
//       }

//       // Instructor ownership enforcement
//       if (role === 'INSTRUCTOR' && course.instructorId !== actorId) {
//         throw new Error('NOT_COURSE_OWNER');
//       }

//       // 2️⃣ Validate enrollment
//       const enrollment = await tx.enrollment.findFirst({
//         where: {
//           userId,
//           courseId,
//           tenantId
//         }
//       });

//       if (!enrollment) {
//         throw new Error('NOT_ENROLLED');
//       }

//       if (!enrollment.completedAt) {
//         throw new Error('COURSE_NOT_COMPLETED');
//       }

//       // 3️⃣ Validate assessment pass (if required)
//       if (course.hasFinalAssessment) {
//         const passedAttempt = await tx.assessmentSubmission.findFirst({
//           where: {
//             userId,
//             courseId,
//             tenantId,
//             score: {
//               gte: course.passingScore ?? 0
//             }
//           }
//         });

//         if (!passedAttempt) {
//           throw new Error('ASSESSMENT_NOT_PASSED');
//         }
//       }

//       // 4️⃣ Issue certificate (unique constraint handles duplicates)
//       const certificate = await tx.certificate.create({
//         data: {
//           tenantId,
//           userId,
//           courseId,
//           issuedBy: actorId,
//           issuedAt: new Date()
//         }
//       });

//       return certificate;
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Certificate issued successfully',
//       data: result
//     });
//   } catch (error) {
//     if (error.code === 'P2002') {
//       return res.status(409).json({
//         success: false,
//         message: 'Certificate already exists'
//       });
//     }

//     const errorMap = {
//       COURSE_NOT_FOUND: 404,
//       NOT_COURSE_OWNER: 403,
//       NOT_ENROLLED: 404,
//       COURSE_NOT_COMPLETED: 400,
//       ASSESSMENT_NOT_PASSED: 400
//     };

//     const status = errorMap[error.message] || 500;

//     return res.status(status).json({
//       success: false,
//       message: error.message || 'Internal server error'
//     });
//   }
// };
// export const getUserCertificatesController = async (req, res) => {
//   const { tenantId } = req.user;
//   const { userId } = req.params;

//   try {
//     const certificates = await prisma.certificate.findMany({
//       where: { userId, tenantId },
//       include: {
//         course: true,
//         issuedByUser: true
//       },
//       orderBy: { issuedAt: 'desc' }
//     });

//     return res.json({
//       success: true,
//       count: certificates.length,
//       data: certificates
//     });
//   } catch {
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// export const getCourseCertificatesController = async (req, res) => {
//   const { tenantId } = req.user;
//   const { courseId } = req.params;

//   try {
//     const certificates = await prisma.certificate.findMany({
//       where: { courseId, tenantId },
//       include: {
//         user: true
//       },
//       orderBy: { issuedAt: 'desc' }
//     });

//     return res.json({
//       success: true,
//       count: certificates.length,
//       data: certificates
//     });
//   } catch {
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// export const getSingleCertificateController = async (req, res) => {
//   const { tenantId } = req.user;
//   const { certificateId } = req.params;

//   try {
//     const certificate = await prisma.certificate.findFirst({
//       where: {
//         id: certificateId,
//         tenantId
//       },
//       include: {
//         user: true,
//         course: true,
//         issuedByUser: true
//       }
//     });

//     if (!certificate) {
//       return res.status(404).json({
//         success: false,
//         message: 'Certificate not found'
//       });
//     }

//     return res.json({
//       success: true,
//       data: certificate
//     });
//   } catch {
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

/**
 * Requirements:
 * - Role: INSTRUCTOR (must own course) or ADMIN
 * - Certificate must belong to tenant
 * - Must not already be revoked
 * - Revocation reason required
 */
// export const revokeCertificateController = async (req, res) => {
//   const { id: actorId, tenantId, role } = req.user;
//   const { certificateId } = req.params;
//   const { reason } = req.body;

//   if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
//     return res.status(400).json({
//       success: false,
//       message: 'Valid revocation reason (min 5 characters) is required'
//     });
//   }

//   if (!['INSTRUCTOR', 'ADMIN'].includes(role)) {
//     return res.status(403).json({
//       success: false,
//       message: 'Forbidden: insufficient permissions'
//     });
//   }

//   try {
//     const revokedCertificate = await prisma.$transaction(async (tx) => {
//       // 1️⃣ Fetch certificate (tenant isolated)
//       const certificate = await tx.certificate.findFirst({
//         where: {
//           id: certificateId,
//           tenantId
//         },
//         include: {
//           course: {
//             select: { instructorId: true }
//           }
//         }
//       });

//       if (!certificate) {
//         throw new Error('CERTIFICATE_NOT_FOUND');
//       }

//       // 2️⃣ Idempotency protection
//       if (certificate.status === 'REVOKED') {
//         throw new Error('ALREADY_REVOKED');
//       }

//       // 3️⃣ Instructor ownership enforcement
//       if (role === 'INSTRUCTOR' && certificate.course.instructorId !== actorId) {
//         throw new Error('NOT_COURSE_OWNER');
//       }

//       // 4️⃣ Perform revocation
//       const updated = await tx.certificate.update({
//         where: { id: certificateId },
//         data: {
//           status: 'REVOKED',
//           revokedAt: new Date(),
//           revokedBy: actorId,
//           revokeReason: reason.trim()
//         }
//       });

//       return updated;
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Certificate revoked successfully',
//       data: revokedCertificate
//     });
//   } catch (error) {
//     const errorMap = {
//       CERTIFICATE_NOT_FOUND: 404,
//       ALREADY_REVOKED: 409,
//       NOT_COURSE_OWNER: 403
//     };

//     const statusCode = errorMap[error.message] || 500;

//     return res.status(statusCode).json({
//       success: false,
//       message: errorMap[error.message] ? error.message : 'Internal server error'
//     });
//   }
// };

// ---------------- ISSUE CERTIFICATE ----------------
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const generateVerificationHash = (payload) => {
  const secret = process.env.CERTIFICATE_SECRET;
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
};

export const issueCertificate = async (req, res, next) => {
  try {
    const { slug, courseId } = req.params;
    const { tenantId, id: userId } = req.user;

    if (!courseId || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Tenant slug and course ID are required'
      });
    }

    const certificate = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validate tenant
      const tenant = await tx.tenant.findUnique({ where: { slug } });

      if (!tenant || tenant.id !== tenantId) {
        throw new Error('INVALID_TENANT');
      }

      // 2️⃣ Validate course
      const course = await tx.course.findFirst({
        where: {
          id: courseId,
          tenantId,
          deletedAt: null
        }
      });

      if (!course) throw new Error('COURSE_NOT_FOUND');

      // 3️⃣ Validate enrollment
      const enrollment = await tx.enrollment.findFirst({
        where: {
          userId,
          courseId,
          deletedAt: null
        }
      });

      if (!enrollment) throw new Error('NOT_ENROLLED');

      // 4️⃣ Validate lessons completion
      const totalLessons = await tx.lesson.count({
        where: {
          courseId,
          tenantId,
          deletedAt: null
        }
      });

      const completedLessons = await tx.progress.count({
        where: {
          userId,
          courseId,
          tenantId,
          completed: true,
          deletedAt: null
        }
      });

      if (totalLessons > 0 && completedLessons !== totalLessons) {
        throw new Error('LESSONS_INCOMPLETE');
      }

      // 5️⃣ Validate assessments passed
      const assessments = await tx.assessment.findMany({
        where: {
          courseId,
          tenantId,
          deletedAt: null
        }
      });

      for (const assessment of assessments) {
        const result = await tx.assessmentResult.findFirst({
          where: {
            assessmentId: assessment.id,
            userId,
            tenantId,
            deletedAt: null,
            passed: true
          }
        });

        if (!result) {
          throw new Error('ASSESSMENTS_INCOMPLETE');
        }
      }

      // 6️⃣ Idempotency — return existing ACTIVE certificate
      const existingCertificate = await tx.certificate.findFirst({
        where: {
          userId,
          courseId,
          tenantId,
          status: 'ACTIVE'
        }
      });

      if (existingCertificate) {
        return existingCertificate;
      }

      // 7️⃣ Generate certificate number
      const certificateNo = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const issuedAt = new Date();

      // 8️⃣ Generate verification hash
      const verificationHash = generateVerificationHash({
        userId,
        courseId,
        certificateNo,
        issuedAt: issuedAt.toISOString()
      });

      // 9️⃣ Create certificate
      return tx.certificate.create({
        data: {
          tenantId,
          userId,
          courseId,
          certificateNo,
          verificationHash,
          issuedAt,
          issuedBy: userId,
          status: 'ACTIVE'
        }
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: certificate
    });
  } catch (error) {
    switch (error.message) {
      case 'INVALID_TENANT':
        return res.status(403).json({
          success: false,
          message: 'Invalid tenant access'
        });

      case 'COURSE_NOT_FOUND':
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });

      case 'NOT_ENROLLED':
        return res.status(404).json({
          success: false,
          message: 'Student not enrolled in this course'
        });

      case 'LESSONS_INCOMPLETE':
        return res.status(403).json({
          success: false,
          message: 'Complete all lessons before certification'
        });

      case 'ASSESSMENTS_INCOMPLETE':
        return res.status(403).json({
          success: false,
          message: 'All assessments must be passed before certification'
        });

      default:
        next(error);
    }
  }
};
