import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';
import { relations } from 'drizzle-orm';

export const profileViewsTable = pgTable(
  'profile_views',
  {
    viewerId: text('viewer_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    viewedId: text('viewed_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
    isNew: boolean('is_new').default(true), // To track unread views
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.viewerId, table.viewedId] }),
  }),
);

export const profileViewsRelations = relations(
  profileViewsTable,
  ({ one }) => ({
    viewer: one(usersTable, {
      fields: [profileViewsTable.viewerId],
      references: [usersTable.id],
    }),
    viewed: one(usersTable, {
      fields: [profileViewsTable.viewedId],
      references: [usersTable.id],
    }),
  }),
);

export type InsertProfileView = typeof profileViewsTable.$inferInsert;
export type SelectProfileView = typeof profileViewsTable.$inferSelect;
