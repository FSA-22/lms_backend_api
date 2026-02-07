import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_EVN || 'development'}.local` });

export const { PORT, CLIENT_URL, NODE_ENV } = process.env;
