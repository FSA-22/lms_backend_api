import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const { PORT, CLIENT_URL, NODE_ENV, DATABASE_URL, DIRECT_URL } = process.env;
