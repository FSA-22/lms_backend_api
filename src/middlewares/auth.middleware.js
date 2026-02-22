import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { ACCESS_TOKEN_SECRET } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token
  const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
  if(decoded.role === 'SUPERUSER'){
    req.user = {
      ...decoded,
      roles: [decoded.role]
    }
    next();
  }
  else {
    try {
    //  Check tenant slug from JWT vs URL
    const tenantFromUrl = req.params.slug;

    if (!decoded.tenant || decoded.tenant !== tenantFromUrl) {
      return res
        .status(403)
        .json({ message: 'Access denied, you do not belong in this organization' });
    }

    // Optionally fetch user from DB (not for tenant check)
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        roles: { select: { role: { select: { name: true } } } }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    // Attach user and decoded token to request
    req.user = {
      ...user,
      tenant: decoded.tenant,
      tenantId: decoded.tenantId,
      roles: user.roles.map((r) => r.role.name.toUpperCase())
    };

    next();
  } catch (error) {
    console.log(error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
    }


};
