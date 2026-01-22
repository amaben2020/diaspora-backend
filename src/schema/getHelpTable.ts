// db/schema/getHelpTable.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const getHelpTable = pgTable('get_help', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  screenshot: text('screenshot'), // Optional URL or Base64 string
  createdAt: timestamp('created_at').defaultNow(),
});
