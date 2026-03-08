// import { prisma } from '../lib/prisma.js';

// export const courseEnrollment = async (req, res, next) => {
//   const { courseId } = req.params;
//   const userId = req.user.id;
//   const tenantId = req.user.tenantId;

//   try {
//     const enrollment = await prisma.$transaction(async (tx) => {
//       // 1️⃣ Verify course exists and belongs to tenant
//       const course = await tx.course.findFirst({
//         where: { id: courseId, tenantId }
//       });

//       if (!course) {
//         throw new Error('Course not found or access denied');
//       }

//       if (!course.isPublished) {
//         throw new Error('Cannot enroll in unpublished course');
//       }

//       // 2️⃣ Prevent duplicate enrollment
//       const existing = await tx.enrollment.findUnique({
//         where: {
//           userId_courseId: {
//             userId,
//             courseId
//           }
//         }
//       });

//       if (existing) {
//         throw new Error('Already enrolled in this course');
//       }

//       // 3️⃣ Create enrollment with tenantId
//       return tx.enrollment.create({
//         data: {
//           userId,
//           courseId,
//           tenantId // ✅ important for multi-tenant safety
//         }
//       });
//     });

//     res.status(201).json({
//       message: 'Enrolled successfully',
//       enrollment
//     });
//   } catch (error) {
//     next(error);
//   }
// };

import { prisma } from '../lib/prisma.js';

/**
 * Enroll student in a course
 */
export const courseEnrollment = async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    const enrollment = await prisma.$transaction(async (tx) => {
      //  Verify course exists and belongs to tenant
      const course = await tx.course.findFirst({
        where: { id: courseId, tenantId, deletedAt: null }
      });

      if (!course) {
        throw new Error('COURSE_NOT_FOUND');
      }

      if (!course.isPublished) {
        throw new Error('COURSE_UNPUBLISHED');
      }

      // Prevent duplicate enrollment
      const existing = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });

      if (existing) {
        throw new Error('ALREADY_ENROLLED');
      }

      // Create enrollment
      return tx.enrollment.create({
        data: {
          userId,
          courseId,
          tenantId
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      enrollment
    });
  } catch (error) {
    if (error.message === 'COURSE_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Course not found or access denied' });
    }
    if (error.message === 'COURSE_UNPUBLISHED') {
      return res
        .status(403)
        .json({ success: false, message: 'Cannot enroll in unpublished course' });
    }
    if (error.message === 'ALREADY_ENROLLED') {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }
    next(error);
  }
};

/**
 * Fetch all enrollments for a course
 */
export const getEnrollments = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, search } = req.query;
    const { tenantId, id: userId, roles } = req.user;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Verify course exists
    const course = await prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Instructor ownership restriction
    if (
      roles.includes('INSTRUCTOR') &&
      !roles.includes('ADMIN') &&
      course.instructorId !== userId
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to view enrollments' });
    }

    // Build filter
    let whereClause = { courseId, tenantId, deletedAt: null };

    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Fetch enrollments + total count
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.enrollment.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      enrollments
    });
  } catch (error) {
    next(error);
  }
};
