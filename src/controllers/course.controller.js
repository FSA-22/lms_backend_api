import { prisma } from '../lib/prisma.js';

/**
 * Create a course
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, isPublished } = req.body;

    // Create course
    const course = await prisma.course.create({
      data: {
        tenantId: req.user.tenantId,
        instructorId: req.user.id,
        title,
        description: description || '',
        isPublished: isPublished || false
      }
    });

    console.log(`Course created: ${course.id} by user ${req.user.id} '${('Course', course)}'`);

    res.status(201).json({ message: 'Course created', course });
  } catch (err) {
    next(err);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, published } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const roles = req.user.roles;

    let whereClause = {
      tenantId
    };

    /*
      Role-based visibility logic
    */

    // STUDENT → only published
    if (roles.includes('STUDENT')) {
      whereClause.isPublished = true;
    }

    // INSTRUCTOR → only their own courses
    if (roles.includes('INSTRUCTOR') && !roles.includes('ADMIN')) {
      whereClause.instructorId = userId;
    }

    // Optional filter override (for ADMIN only)
    if (roles.includes('ADMIN') && published !== undefined) {
      whereClause.isPublished = published === 'true';
    }

    console.log(
      `Fetching courses for user ${userId} with roles ${roles.join(', ')} and filters:`,
      whereClause
    );

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count({ where: whereClause })
    ]);

    return res.status(200).json({
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      courses
    });
  } catch (error) {
    next(error);
  }
};
