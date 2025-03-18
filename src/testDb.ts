// db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.test' }); // or .env.local

// Determine which database URL to use based on NODE_ENV
const DATABASE_URL = process.env.TEST_DATABASE_URL;

console.log(`DATABASE_URL FOR ${process.env.NODE_ENV}:`, DATABASE_URL);
if (!DATABASE_URL) {
  throw new Error(
    `${DATABASE_URL} is not defined in the environment variables.`,
  );
}

// Initialize the database client
const sql = neon(DATABASE_URL);
export const testDB = drizzle(sql);
