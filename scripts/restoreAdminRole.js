import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';

// async function restoreAdmin() {
//   const userEmail = 'mineandmine@gmail.com';
//   const tenantId = 'fa3e2a52-8ba0-4571-a281-5916f0191807';

//   const user = await prisma.user.findUnique({
//     where: {
//       tenantId_email: {
//         tenantId,
//         email: userEmail
//       }
//     }
//   });

//   if (!user) {
//     console.log('User not found');
//     return;
//   }

//   const role = await prisma.role.findUnique({
//     where: { name: 'ADMIN' }
//   });

//   if (!role) {
//     console.log('Role not found');
//     return;
//   }

//   await prisma.userRole.create({
//     data: {
//       userId: user.id,
//       roleId: role.id
//     }
//   });

//   console.log('Admin role restored');
// }

// restoreAdmin();

const hashedPassword = await bcrypt.hash('StrongPasswordHere', 12);

const superAdmin = await prisma.user.create({
  data: {
    tenantId: someSystemTenantId,
    firstName: 'System',
    lastName: 'Administrator',
    email: 'superadmin@lms.com',
    password: hashedPassword
  }
});

await prisma.userRole.create({
  data: {
    userId: superAdmin.id,
    roleId: superAdminRoleId
  }
});
