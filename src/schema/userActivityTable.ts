import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';
import { relations } from 'drizzle-orm';

export const userActivityTable = pgTable('user_activity', {
  userId: text('user_id')
    .primaryKey()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  onlineStatus: boolean('online_status').default(false),
  lastActive: timestamp('last_active', { withTimezone: true }),
});

export const userActivityTableRelations = relations(
  userActivityTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userActivityTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export type InsertUserActivityTable = typeof userActivityTable.$inferInsert;
export type SelectUserActivityTable = typeof userActivityTable.$inferSelect;
