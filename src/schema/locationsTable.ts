import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const locationsTable = pgTable(
  'locations',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    latitude: text('latitude').notNull(),
    longitude: text('longitude').notNull(),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueUser: uniqueIndex('unique_location').on(table.userId),
  }),
);

export const locationsRelations = relations(locationsTable, ({ one }) => ({
  location: one(usersTable, {
    fields: [locationsTable.userId],
    references: [usersTable.id],
  }),
}));

export type InsertLocations = typeof locationsTable.$inferInsert;
export type SelectLocations = typeof locationsTable.$inferSelect;
