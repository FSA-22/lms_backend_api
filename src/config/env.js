import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_EVN || 'development'}.local` });

export const { PORT, CLIENT_URL, NODE_ENV, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = process.env;
