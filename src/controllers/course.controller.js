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
    const { tenantId, id: userId, roles } = req.user;

    // Pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Optional filters
    const publishedQuery =
      req.query.published !== undefined ? req.query.published === 'true' : undefined;

    // Base filter (multi-tenant + soft delete)
    const where = {
      tenantId,
      deletedAt: null
    };

    /**
     * Role-based access control
     */
    if (roles.includes('ADMIN') || roles.includes('SUPERUSER')) {
      if (publishedQuery !== undefined) {
        where.isPublished = publishedQuery;
      }
    } else if (roles.includes('INSTRUCTOR')) {
      where.instructorId = userId;

      if (publishedQuery !== undefined) {
        where.isPublished = publishedQuery;
      }
    } else if (roles.includes('STUDENT')) {
      where.isPublished = true;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'asc' } // deterministic ordering
        ],
        select: {
          id: true,
          title: true,
          description: true,
          isPublished: true,
          instructorId: true,
          createdAt: true
        }
      }),

      prisma.course.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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

    const { tenantId, id: userId, roles } = req.user;

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId,
        deletedAt: null
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Instructor permission check
    if (
      roles.includes('INSTRUCTOR') &&
      !roles.includes('ADMIN') &&
      course.instructorId !== userId
    ) {
      return res.status(403).json({
        message: 'Not allowed to update this course'
      });
    }

    // Prevent publishing without approval
    if (isPublished === true && course.status !== 'APPROVED') {
      return res.status(403).json({
        message: 'Course must be approved before publishing'
      });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: title ?? course.title,
        description: description ?? course.description,
        isPublished: isPublished ?? course.isPublished
      }
    });

    res.status(200).json({
      message: 'Course updated',
      course: updated
    });
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
