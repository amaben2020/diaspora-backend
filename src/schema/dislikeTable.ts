import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';
import { relations } from 'drizzle-orm';

export const dislikesTable = pgTable(
  'dislikes',
  {
    dislikerId: text('disliker_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    dislikedId: text('disliked_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    likedAt: timestamp('disliked_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.dislikerId, table.dislikedId] }),
  }),
);

export const dislikesTableRelations = relations(dislikesTable, ({ one }) => ({
  disliker: one(usersTable, {
    fields: [dislikesTable.dislikerId],
    references: [usersTable.id],
  }),
  disliked: one(usersTable, {
    fields: [dislikesTable.dislikedId],
    references: [usersTable.id],
  }),
}));

export type InsertLike = typeof dislikesTable.$inferInsert;
export type SelectLike = typeof dislikesTable.$inferSelect;
