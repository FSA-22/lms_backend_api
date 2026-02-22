import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN } from '../config/env.js';

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export const generateToken = (payload) => {
    if (payload?.role === 'SUPERUSER') {
    return jwt.sign({
      sub: payload.email,
      role: payload.role
    }, 
    ACCESS_TOKEN_SECRET,
     {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'lms-api',
      audience: 'lms-client'
    });
  }

  if (!payload?.userId || !payload?.tenantId || !payload?.tenant) {
    throw new Error('Invalid token payload');
  }

  return jwt.sign(
    {
      sub: payload.userId,
      tenantId: payload.tenantId,
      tenant: payload.tenant,
      role: payload.role
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'lms-api',
      audience: 'lms-client'
    }
  );
};
