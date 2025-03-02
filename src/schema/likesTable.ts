import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';
import { relations } from 'drizzle-orm';

export const likesTable = pgTable(
  'likes',
  {
    likerId: text('liker_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    likedId: text('liked_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    likedAt: timestamp('liked_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.likerId, table.likedId] }),
  }),
);

export const likesTableRelations = relations(likesTable, ({ one }) => ({
  liker: one(usersTable, {
    fields: [likesTable.likerId],
    references: [usersTable.id],
  }),
  liked: one(usersTable, {
    fields: [likesTable.likedId],
    references: [usersTable.id],
  }),
}));

export type InsertLike = typeof likesTable.$inferInsert;
export type SelectLike = typeof likesTable.$inferSelect;
