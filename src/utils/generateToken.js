import jwt from 'jsonwebtoken';
import { JWT_SECRET, EXPIRES_IN } from '../config/env.js';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined ');
}

export const generateToken = (payload) => {
  if (!payload?.userId || !payload?.tenantId) {
    throw new Error('Invalid token payload');
  }

  return jwt.sign(
    {
      sub: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role
    },
    JWT_SECRET,
    {
      expiresIn: EXPIRES_IN,
      issuer: 'lms-api',
      audience: 'lms-client'
    }
  );
};
