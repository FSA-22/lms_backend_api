import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRES_IN, ACCESS_TOKEN_SECRET } from '../config/env.js';

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export const generateToken = (payload) => {
<<<<<<< HEAD
    if (payload?.role === 'SUPERUSER'.toLowerCase()) {
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
=======
  if (payload?.role === 'SUPERUSER') {
    return jwt.sign(
      {
        sub: payload.email,
        role: payload.role
      },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        issuer: 'lms-api',
        audience: 'lms-client'
      }
    );
>>>>>>> 8f0d086676f8d8d3da9263c59252079d3d8552f3
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
