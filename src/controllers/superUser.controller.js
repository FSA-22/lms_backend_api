import { prisma } from '../lib/prisma.js';
import { generateToken } from '../utils/generateToken.js';

// PLATFORM OVERVIEW
export const getPlatformOverview = async (req, res, next) => {
  try {
    const [totalTenants, totalUsers, totalCourses, totalEnrollments, totalCertificates] =
      await Promise.all([
        prisma.tenant.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.course.count({ where: { deletedAt: null } }),
        prisma.enrollment.count(),
        prisma.certificate.count()
      ]);

    res.status(200).json({
      success: true,
      data: { totalTenants, totalUsers, totalCourses, totalEnrollments, totalCertificates }
    });
  } catch (err) {
    next(err);
  }
};

// TENANT MANAGEMENT
export const listTenants = async (req, res, next) => {
  try {
    let { page = 1, limit = 20, search, isActive } = req.query;

    page = Number(page);
    limit = Number(limit);

    const where = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [tenants, total] = await prisma.$transaction([
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.count({ where })
    ]);

    res.json({
      success: true,
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        lastPage: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getTenantDetails = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
};

export const createTenant = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug)
      return res.status(400).json({ success: false, message: 'Name and slug required' });

    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ success: false, message: 'Slug already exists' });

    const tenant = await prisma.tenant.create({ data: { name, slug } });
    res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
};

export const suspendTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    await prisma.tenant.update({ where: { id: tenantId }, data: { isActive: false } });
    res.json({ success: true, message: 'Tenant suspended' });
  } catch (err) {
    next(err);
  }
};

export const activateTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    await prisma.tenant.update({ where: { id: tenantId }, data: { isActive: true } });
    res.json({ success: true, message: 'Tenant activated' });
  } catch (err) {
    next(err);
  }
};

export const deleteTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    await prisma.tenant.update({ where: { id: tenantId }, data: { deletedAt: new Date() } });
    res.json({ success: true, message: 'Tenant deleted (soft delete)' });
  } catch (err) {
    next(err);
  }
};

// TENANT SUBSCRIPTION
export const updateTenantSubscription = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { planId, status, expiresAt } = req.body;

    const subscription = await prisma.subscription.upsert({
      where: { tenantId },
      update: { planId, status, expiresAt },
      create: { tenantId, planId, status, expiresAt }
    });

    res.json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
};

// PLATFORM USERS
export const getPlatformUsers = async (req, res, next) => {
  try {
    let { page = 1, limit = 20, search, role, isActive } = req.query;
    page = Number(page);
    limit = Number(limit);

    const where = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { roles: { some: { role: { name: role } } } })
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { roles: { select: { role: { select: { name: true } } } } }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        isActive: u.isActive,
        roles: u.roles.map((r) => r.role.name)
      })),
      pagination: {
        page,
        limit,
        total,
        lastPage: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};
// TENANT IMPERSONATION (OPTIONAL)
export const impersonateTenantAdmin = async (req, res, next) => {
  try {
    const { tenantAdminId } = req.body;

    const user = await prisma.user.findFirst({ where: { id: tenantAdminId, isActive: true } });
    if (!user) return res.status(404).json({ success: false, message: 'Tenant admin not found' });

    const token = generateToken({
      id: user.id,
      tenantId: user.tenantId,
      roles: user.roles.map((r) => r.role.name)
    });

    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};
