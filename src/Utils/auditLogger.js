import { prisma } from '../lib/prisma.js';

export const logAudit = async ({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
  req
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};
