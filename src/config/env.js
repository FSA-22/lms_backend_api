import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  PORT,
  CLIENT_URL,
  NODE_ENV,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  DATABASE_URL,
  DIRECT_URL,
  SUPER_USER_NAME,
  SUPER_USER_EMAIL,
  SUPERUSER_PASSWORD,
  CERTIFICATE_SECRET,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD
} = process.env;
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}
