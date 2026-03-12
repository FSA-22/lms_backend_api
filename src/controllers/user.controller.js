import { prisma } from '../lib/prisma.js';

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        tenantId: req.user.tenantId,
        isActive: true
      },
      include: {
        tenant: true,

        roles: {
          select: {
            role: { select: { name: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles.map((r) => r.role.name)
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { tenantId } = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: {
            select: {
              role: { select: { name: true } }
            }
          }
        }
      }),
      prisma.user.count({ where: { tenantId } })
    ]);

    return res.json({
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      },
      data: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive,
        roles: user.roles.map((r) => r.role.name)
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        roles: {
          select: {
            role: { select: { name: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId, roles, id: currentUserId } = req.user;

    const isAdmin = roles.includes('ADMIN');
    const isSelf = currentUserId === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { firstName, lastName, password } = req.body;

    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.updateMany({
      where: { id, tenantId },
      data: updateData
    });

    if (!updatedUser.count) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    await prisma.user.updateMany({
      where: { id, tenantId },
      data: { isActive: false }
    });

    return res.json({ message: 'User deactivated' });
  } catch (error) {
    next(error);
  }
};
