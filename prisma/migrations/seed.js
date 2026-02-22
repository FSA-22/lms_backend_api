import { prisma } from '../../src/lib/prisma.js';

async function main() {
  console.log('🌱 Seeding database...');

  //  PLANS
  await prisma.plan.createMany({
    data: [
      { name: 'FREE', price: 0, maxUsers: 10, maxCourses: 5 },
      { name: 'PRO', price: 49, maxUsers: 200, maxCourses: 100 }
    ],
    skipDuplicates: true
  });

  //  ROLES
  const roles = ['SUPERUSER','ADMIN', 'INSTRUCTOR', 'STUDENT'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log('✅ Plan & Roles seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
