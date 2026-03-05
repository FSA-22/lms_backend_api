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
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const result = await prisma.course.updateMany({
      where: {
        id: courseId, // NOT courseId
        tenantId: tenantId
      },
      data: {
        status: 'APPROVED'
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or does not belong to tenant'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course approved'
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
      _count: { _all: true }
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.auditLog.count({
      where: { tenantId }
    });

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenantSettings = async (req, res, next) => {
  try {
    const { id: userId, tenantId, roles } = req.user;

    // 1️⃣ Role Authorization
    if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update tenant settings'
      });
    }

    // 2️⃣ Whitelist allowed fields for tenant settings
    const allowedFields = ['name', 'slug', 'logoUrl', 'website', 'supportEmail'];
    const updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    // 3️⃣ Perform atomic transaction: update tenant + audit log
    const updatedTenant = await prisma.$transaction(async (tx) => {
      // Ensure tenant exists and is active
      const existingTenant = await tx.tenant.findFirst({
        where: { id: tenantId, deletedAt: null }
      });

      if (!existingTenant) {
        throw new Error('Tenant not found');
      }

      // Update tenant
      const tenant = await tx.tenant.update({
        where: { id: tenantId },
        data: updateData
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'UPDATE_TENANT_SETTINGS',
          entityType: 'Tenant',
          entityId: tenantId,
          metadata: updateData,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      return tenant;
    });

    // 4️⃣ Respond safely (only expose safe fields)
    return res.status(200).json({
      success: true,
      message: 'Tenant settings updated successfully',
      data: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        logoUrl: updatedTenant.logoUrl,
        website: updatedTenant.website,
        supportEmail: updatedTenant.supportEmail
      }
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
