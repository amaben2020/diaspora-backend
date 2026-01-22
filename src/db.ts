// db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' }); // or .env.local

// Determine which database URL to use based on ENVIRONMENT
// const DATABASE_URL =
//   process.env.ENVIRONMENT === 'production'
//     ? process.env.PROD_DATABASE_URL
//     : process.env.ENVIRONMENT === 'development'
//       ? process.env.DEV_DATABASE_URL
//       : process.env.ENVIRONMENT === 'staging'
//         ? process.env.STAGING_DATABASE_URL
//         : process.env.TEST_DATABASE_URL;

const DATABASE_URL = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;

console.log(`DATABASE_URL FOR ${process.env.ENVIRONMENT}:`, DATABASE_URL);

if (!DATABASE_URL) {
  throw new Error(
    `${DATABASE_URL} is not defined in the environment variables.`,
  );
}

// Initialize the database client
const sql = neon(DATABASE_URL);

export const db = drizzle(sql);
