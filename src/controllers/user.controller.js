import { prisma } from '../lib/prisma.js';



export const getCurrentUser = async (req, res) => {
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
};

export const getAllUsers = async (req, res) => {
  const { tenantId } = req.user;

  const users = await prisma.user.findMany({
    where: { tenantId },
    include: {
      roles: { include: { role: true } }
    }
  });

  res.json(users);
};
