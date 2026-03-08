import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

import {
  SUPERUSER_PASSWORD,
  SUPER_USER_EMAIL,
  SUPER_USER_FIRST_NAME,
  SUPER_USER_LAST_NAME
} from '../src/config/env.js';

const run = async () => {
  try {
    if (!SUPER_USER_EMAIL || !SUPERUSER_PASSWORD) {
      throw new Error('Superuser environment variables are not set');
    }

    const email = SUPER_USER_EMAIL;
    const hashedPassword = await bcrypt.hash(SUPERUSER_PASSWORD, 12);

    await prisma.$transaction(async (tx) => {
      // 1. Ensure Platform Tenant exists
      const platformTenant = await tx.tenant.upsert({
        where: { slug: 'platform' },
        update: {}, // nothing to update
        create: {
          name: 'Platform',
          slug: 'platform',
          isActive: true
        }
      });

      // 2. Ensure SUPERUSER role exists
      const superRole = await tx.role.upsert({
        where: { name: 'SUPERUSER' },
        update: {},
        create: { name: 'SUPERUSER' }
      });

      // 3. Ensure SUPERUSER user exists for platform tenant
      const user = await tx.user.upsert({
        where: {
          tenantId_email: {
            tenantId: platformTenant.id,
            email
          }
        },
        update: {},
        create: {
          tenantId: platformTenant.id,
          firstName: SUPER_USER_FIRST_NAME,
          lastName: SUPER_USER_LAST_NAME,
          email,
          password: hashedPassword,
          isActive: true
        }
      });

      // 4. Assign SUPERUSER role if not already assigned
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: superRole.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: superRole.id
        }
      });

      // 5. Audit log (optional, only runs if user was created)
      await tx.auditLog.create({
        data: {
          tenantId: platformTenant.id,
          userId: user.id,
          action: 'CREATE_SUPERUSER',
          entityType: 'User',
          entityId: user.id,
          metadata: { email }
        }
      });
    });

    console.log('SUPERUSER bootstrap completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create SUPERUSER:', err.message);
    process.exit(1);
  }
};

run();
