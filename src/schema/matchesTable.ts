import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const matchesTable = pgTable(
  'matches',
  {
    user1Id: text('user1_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    user2Id: text('user2_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    matchedAt: timestamp('matched_at', { withTimezone: true }).defaultNow(),
    status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, rejected
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.user1Id, table.user2Id] }),
  }),
);

export const matchesTableRelations = relations(matchesTable, ({ one }) => ({
  user1: one(usersTable, {
    fields: [matchesTable.user1Id],
    references: [usersTable.id],
  }),
  user2: one(usersTable, {
    fields: [matchesTable.user2Id],
    references: [usersTable.id],
  }),
}));

export type InsertMatch = typeof matchesTable.$inferInsert;
export type SelectMatch = typeof matchesTable.$inferSelect;
