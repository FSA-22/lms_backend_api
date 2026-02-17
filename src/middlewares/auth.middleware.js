import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { JWT_SECRET } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.sub,
        tenantId: decoded.tenantId,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // We need to find a way to check if the user belongs to the tenant specified in the URL. This is a bit tricky because we don't want to query the database for every request just to check the tenant. One way to do this is to include the tenant slug in the JWT token when the user logs in, and then compare it with the slug in the URL.

    // if (!user.tenant || req.params.slug !== user.tenant.slug) {
    //   return res
    //     .status(403)
    //     .json({ message: 'Tenant mismatch, you do not belong in this organization' });
    // }

    req.user = user;

    console.log('req.user:', req);

    next();
  } catch (error) {
    console.log(error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
