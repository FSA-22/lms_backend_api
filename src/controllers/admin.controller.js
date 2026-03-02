import { prisma } from '../lib/prisma.js';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const { tenantId } = req.user;

    const [totalUsers, totalCourses, totalEnrollments, totalCertificates] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.course.count({ where: { tenantId } }),
      prisma.enrollment.count({ where: { tenantId } }),
      prisma.certificate.count({ where: { tenantId } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalCertificates
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10, role, search } = req.query;

    const where = {
      tenantId,
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role: newRoleName } = req.body;
    const { id: currentUserId, tenantId } = req.user;

    if (!newRoleName) {
      return res.status(400).json({
        success: false,
        message: 'role is required'
      });
    }

    // Prevent self-demotion
    if (currentUserId === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify your own role.'
      });
    }

    // Ensure target user exists in this tenant
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this tenant'
      });
    }

    // Find target role by name
    const targetRole = await prisma.role.findUnique({
      where: { name: newRoleName }
    });

    if (!targetRole) {
      return res.status(404).json({
        success: false,
        message: 'Target role not found'
      });
    }

    // Prevent removing last ADMIN in tenant
    const adminCount = await prisma.userRole.count({
      where: {
        role: { name: 'ADMIN' },
        user: { tenantId }
      }
    });

    const isTargetUserAdmin = user.roles.some((r) => r.role.name === 'ADMIN');

    if (isTargetUserAdmin && newRoleName !== 'ADMIN' && adminCount <= 1) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove the last ADMIN of this tenant'
      });
    }

    // Replace role atomically
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId }
      });

      await tx.userRole.create({
        data: {
          userId,
          roleId: targetRole.id
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const listCourses = async (req, res, next) => {
  try {
    const { tenantId } = req.user;

    const courses = await prisma.course.findMany({
      where: { tenantId },
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

export const approveCourse = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const course = await prisma.course.update({
      where: { id, tenantId },
      data: { status: 'APPROVED' }
    });

    return res.status(200).json({
      success: true,
      message: 'Course approved',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentStats = async (req, res, next) => {
  try {
    const { tenantId } = req.user;

    const stats = await prisma.enrollment.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true
    });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const listCertificates = async (req, res, next) => {
  try {
    const { tenantId } = req.user;

    const certificates = await prisma.certificate.findMany({
      where: { tenantId },
      include: {
        student: { select: { name: true, email: true } },
        course: { select: { title: true } }
      },
      orderBy: { issuedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};
export const getAuditLogs = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: Number(limit)
    });

    const total = await prisma.auditLog.count({
      where: { tenantId }
    });

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};
export const updateTenantSettings = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { name, logoUrl } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, logoUrl }
    });

    return res.status(200).json({
      success: true,
      message: 'Tenant settings updated',
      data: tenant
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const { tenantId } = req.user;

    const grouped = await prisma.userRole.groupBy({
      by: ['roleId'],
      where: {
        user: {
          tenantId,
          deletedAt: null
        }
      },
      _count: {
        userId: true
      }
    });

    const roles = await prisma.role.findMany();

    const stats = grouped.map((g) => {
      const role = roles.find((r) => r.id === g.roleId);

      return {
        roleId: g.roleId,
        roleName: role?.name ?? 'Unknown',
        count: g._count.userId
      };
    });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
