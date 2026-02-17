import { prisma } from '../lib/prisma.js';

/**
 * Helper: check if user has required role
 */
const hasRole = (userRoles, requiredRoles) =>
  userRoles.some((r) => requiredRoles.includes(r.role.name));

/**
 * Create a course
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, isPublished } = req.body;

    // Only INSTRUCTOR can create courses
    if (!req.user || !hasRole(req.user.roles, ['INSTRUCTOR'])) {
      return res.status(403).json({ message: 'Forbidden: Only INSTRUCTOR can create courses' });
    }

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

    res.status(201).json({ message: 'Course created', course });
  } catch (err) {
    next(err);
  }
};
