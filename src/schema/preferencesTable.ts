import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  serial,
  // pgEnum,
} from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';
// import { INTERESTS } from '../constants';

// export const datingPreferenceEnum = pgEnum('dating_preference', [
//   'Man',
//   'Woman',
//   'Non Binary',
// ]);

// const INTERESTS_ARRAY = (
//   INTERESTS.length > 0 ? INTERESTS.map((interest) => interest.title) : ['']
// ) as [string];

// export const interestPreferenceEnum = pgEnum('interests', INTERESTS_ARRAY);

export const preferencesTable = pgTable(
  'preferences',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .$onUpdate(() => new Date()),
    ethnicity: varchar('ethnicity', { length: 50 }),
    pronouns: varchar('pronouns', { length: 50 }),
    zodiac: varchar('pronouns', { length: 50 }),
    bio: varchar('pronouns', { length: 50 }),
    // interest: interestPreferenceEnum('interests'),

    interests: text('interests').array(),

    smoking: boolean('smoking'),
    drinking: boolean('drinking'),
    religion: varchar('religion', { length: 50 }),
    education: varchar('education', { length: 50 }),
    // lookingToDate: datingPreferenceEnum('looking_to_date'),
    lookingToDate: text('looking_to_date').array(),
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
