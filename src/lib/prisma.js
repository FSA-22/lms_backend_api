import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaClient } from '../generated/prisma/index.js';

import { DATABASE_URL } from '../config/env.js';

const connectionString = DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
