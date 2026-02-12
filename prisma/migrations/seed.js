import { prisma } from '../../src/lib/prisma.js';

async function main() {
  await prisma.role.createMany({
    data: [{ name: 'ADMIN' }, { name: 'INSTRUCTOR' }, { name: 'STUDENT' }],
    skipDuplicates: true
  });

  await prisma.plan.createMany({
    data: [
      { name: 'FREE', price: 0, maxUsers: 10, maxCourses: 5 },
      { name: 'PRO', price: 49, maxUsers: 200, maxCourses: 100 }
    ],
    skipDuplicates: true
  });

  console.log('Seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
