import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';

// Add these tables to your schema
export const reportsTable = pgTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').references(() => usersTable.id),
  reportedId: text('reported_id').references(() => usersTable.id),
  reason: text('reason'),
  details: text('details'),
  status: text('status', { enum: ['pending', 'reviewed', 'resolved'] }).default(
    'pending',
  ),
  createdAt: timestamp('created_at').defaultNow(),
});
