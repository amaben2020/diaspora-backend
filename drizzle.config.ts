import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

const DATABASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.PROD_DATABASE_URL
    : process.env.DEV_DATABASE_URL;

export default defineConfig({
  schema: './src/schema/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL!,
  },
});
