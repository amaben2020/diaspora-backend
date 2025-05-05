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
import { usersTable } from './usersTable.ts';
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

    interests: text('interests').array(),
    lookingToDate: text('looking_to_date').array(),

    ethnicity: varchar('ethnicity', { length: 50 }).default(''),
    pronouns: varchar('pronouns', { length: 50 }).default(''),
    zodiac: varchar('zodiac', { length: 50 }).default(''),
    bio: varchar('bio', { length: 50 }).default(''),
    // interest: interestPreferenceEnum('interests'),

    smoking: boolean('smoking').default(false),
    drinking: boolean('drinking').default(false),
    religion: varchar('religion', { length: 50 }).default(''),
    education: varchar('education', { length: 50 }).default(''),
    pets: varchar('pets', { length: 50 }).default(''),
    age: varchar('age', { length: 50 }).default(''),
    distance: varchar('distance', { length: 50 }).default(''),
    language: varchar('language', { length: 50 }).default(''),
    familyPlans: varchar('familyPlans', { length: 50 }).default(''),
    gender: varchar('gender', { length: 50 }).default(''),
    height: varchar('height', { length: 50 }).default(''),
    hasBio: boolean('hasBio').default(false),
    minNumberOfPhotos: varchar('min_photos').default(''),
    connections: varchar('connections').default(''),

    // lookingToDate: datingPreferenceEnum('looking_to_date'),
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
