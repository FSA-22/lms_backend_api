import { config } from 'dotenv';

const nodeEnv = process.env.NODE_ENV || 'development';

config({ path: `.env.${nodeEnv}.local` });
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment');
}

export const { PORT, CLIENT_URL, NODE_ENV } = process.env;
