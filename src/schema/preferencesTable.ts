import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const preferencesTable = pgTable(
  'preferences',
  {
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    ethnicity: varchar('ethnicity', { length: 50 }),
    pronouns: varchar('pronouns', { length: 50 }),
    interests: text('interests').array(),
    smoking: boolean('smoking'),
    drinking: boolean('drinking'),
    religion: varchar('religion', { length: 50 }),
    education: varchar('education', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueUser: uniqueIndex('unique_preferences').on(table.userId),
  }),
);

export const preferencesRelations = relations(preferencesTable, ({ one }) => ({
  preference: one(usersTable, {
    fields: [preferencesTable.userId],
    references: [usersTable.id],
  }),
}));

export type InsertPreferences = typeof preferencesTable.$inferInsert;
export type SelectPreferences = typeof preferencesTable.$inferSelect;
