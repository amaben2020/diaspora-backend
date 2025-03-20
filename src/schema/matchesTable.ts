// import {
//   pgTable,
//   primaryKey,
//   text,
//   timestamp,
//   varchar,
// } from 'drizzle-orm/pg-core';
// import { usersTable } from './usersTable.ts';
// import { relations } from 'drizzle-orm';

// export const matchesTable = pgTable(
//   'matches',
//   {
//     user1Id: text('user1_id').references(() => usersTable.id, {
//       onDelete: 'cascade',
//     }),
//     user2Id: text('user2_id')
//       .notNull()
//       .references(() => usersTable.id, { onDelete: 'cascade' }),
//     matchedAt: timestamp('matched_at', { withTimezone: true }).defaultNow(),
//     status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, rejected
//   },
//   (table) => ({
//     primaryKey: primaryKey({ columns: [table.user1Id, table.user2Id] }),
//   }),
// );

// export const matchesTableRelations = relations(matchesTable, ({ one }) => ({
//   user1: one(usersTable, {
//     fields: [matchesTable.user1Id],
//     references: [usersTable.id],
//   }),
//   user2: one(usersTable, {
//     fields: [matchesTable.user2Id],
//     references: [usersTable.id],
//   }),
// }));

// export type InsertMatch = typeof matchesTable.$inferInsert;
// export type SelectMatch = typeof matchesTable.$inferSelect;

import { pgTable, unique, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';
import { relations } from 'drizzle-orm';

export const matchesTable = pgTable(
  'matches',
  {
    user1Id: text('user1_id')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(), // Keep NOT NULL if required
    user2Id: text('user2_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    matchedAt: timestamp('matched_at', { withTimezone: true }).defaultNow(),
    status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, rejected
  },
  (table) => ({
    uniqueMatch: unique('unique_match').on(table.user1Id, table.user2Id), // Add a unique constraint
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
