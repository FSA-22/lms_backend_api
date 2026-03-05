// import { prisma } from '../lib/prisma.js';

// /**
//  * Create a course
//  */
// export const createCourse = async (req, res, next) => {
//   try {
//     const { title, description, isPublished } = req.body;

//     // Create course
//     const course = await prisma.course.create({
//       data: {
//         tenantId: req.user.tenantId,
//         instructorId: req.user.id,
//         title,
//         description: description || '',
//         isPublished: isPublished || false
//       }
//     });

//     console.log(`Course created: ${course.id} by user ${req.user.id} '${('Course', course)}'`);

//     res.status(201).json({ message: 'Course created', course });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getCourses = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 10, published } = req.query;

//     const pageNumber = parseInt(page, 10);
//     const pageSize = parseInt(limit, 10);
//     const skip = (pageNumber - 1) * pageSize;

//     const tenantId = req.user.tenantId;
//     const userId = req.user.id;
//     const roles = req.user.roles;

//     let whereClause = {
//       tenantId
//     };

//     /*
//       Role-based visibility logic
//     */

//     // STUDENT → only published
//     if (roles.includes('STUDENT')) {
//       whereClause.isPublished = true;
//     }

//     // INSTRUCTOR → only their own courses
//     if (roles.includes('INSTRUCTOR') && !roles.includes('ADMIN')) {
//       whereClause.instructorId = userId;
//     }

//     // Optional filter override (for ADMIN only)
//     if (roles.includes('ADMIN') && published !== undefined) {
//       whereClause.isPublished = published === 'true';
//     }

//     console.log(
//       `Fetching courses for user ${userId} with roles ${roles.join(', ')} and filters:`,
//       whereClause
//     );

//     const [courses, total] = await Promise.all([
//       prisma.course.findMany({
//         where: whereClause,
//         skip,
//         take: pageSize,
//         orderBy: { createdAt: 'desc' }
//       }),
//       prisma.course.count({ where: whereClause })
//     ]);

//     return res.status(200).json({
//       page: pageNumber,
//       limit: pageSize,
//       total,
//       totalPages: Math.ceil(total / pageSize),
//       courses
//     });
//   } catch (error) {
//     next(error);
//   }
// };

import { prisma } from '../lib/prisma.js';

/**
 * CREATE COURSE
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const course = await prisma.course.create({
      data: {
        tenantId: req.user.tenantId,
        instructorId: req.user.id,
        title,
        description: description || '',
        isPublished: false
      }
    });

    console.log(`Course created: ${course.id} by ${req.user.id}`);

    return res.status(201).json({
      message: 'Course created successfully',
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        isPublished: course.isPublished,
        createdAt: course.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET COURSES (Tenant + Role Scoped)
 */
export const getCourses = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // cap at 50
    const skip = (page - 1) * limit;

    let whereClause = { tenantId };

    // Role hierarchy
    if (roles.includes('ADMIN') || roles.includes('SUPERUSER')) {
      if (req.query.published !== undefined) {
        whereClause.isPublished = req.query.published === 'true';
      }
    } else if (roles.includes('INSTRUCTOR')) {
      whereClause.instructorId = userId;
    } else if (roles.includes('STUDENT')) {
      whereClause.isPublished = true;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          isPublished: true,
          createdAt: true,
          instructorId: true
        }
      }),
      prisma.course.count({ where: whereClause })
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      courses
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // STUDENT → must be published
    if (roles.includes('STUDENT') && !course.isPublished) {
      return res.status(403).json({ message: 'Course not available' });
    }

    // INSTRUCTOR → must own it (unless ADMIN)
    if (
      roles.includes('INSTRUCTOR') &&
      !roles.includes('ADMIN') &&
      course.instructorId !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, isPublished } = req.body;

    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const course = await prisma.course.findFirst({
      where: { id: courseId, tenantId }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Instructor restriction
    if (
      roles.includes('INSTRUCTOR') &&
      !roles.includes('ADMIN') &&
      course.instructorId !== userId
    ) {
      return res.status(403).json({ message: 'Not allowed to update this course' });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: title ?? course.title,
        description: description ?? course.description,
        isPublished: isPublished ?? course.isPublished
      }
    });

    res.status(200).json({ message: 'Course updated', course: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    const course = await prisma.course.findFirst({
      where: { id: courseId, tenantId }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (
      roles.includes('INSTRUCTOR') &&
      !roles.includes('ADMIN') &&
      course.instructorId !== userId
    ) {
      return res.status(403).json({ message: 'Not allowed to delete this course' });
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
};
