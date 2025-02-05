import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const profileViewsTable = pgTable(
  'profile_views',
  {
    viewerId: text('viewer_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    profileId: text('profile_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.viewerId, table.profileId] }),
  }),
);

export const profileViewsTableRelations = relations(
  profileViewsTable,
  ({ one }) => ({
    viewer: one(usersTable, {
      fields: [profileViewsTable.viewerId],
      references: [usersTable.id],
    }),
    profile: one(usersTable, {
      fields: [profileViewsTable.profileId],
      references: [usersTable.id],
    }),
  }),
);

export type InsertProfileView = typeof profileViewsTable.$inferInsert;
export type SelectProfileView = typeof profileViewsTable.$inferSelect;
