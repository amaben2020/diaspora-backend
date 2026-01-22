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

    // New profile fields
    jobTitle: varchar('job_title', { length: 100 }).default(''),
    company: varchar('company', { length: 100 }).default(''),
    school: varchar('school', { length: 100 }).default(''),
    sexuality: varchar('sexuality', { length: 50 }).default(''),
    bodyType: varchar('body_type', { length: 50 }).default(''),
    dietaryPreference: varchar('dietary_preference', { length: 50 }).default(''),
    sleepingHabits: varchar('sleeping_habits', { length: 50 }).default(''),
    workoutFrequency: varchar('workout_frequency', { length: 50 }).default(''),
    loveLanguage: varchar('love_language', { length: 50 }).default(''),
    travelPlans: varchar('travel_plans', { length: 100 }).default(''),
    personality: varchar('personality', { length: 50 }).default(''),
    relationshipStatus: varchar('relationship_status', { length: 50 }).default(''),
    willingToRelocate: boolean('willing_to_relocate').default(false),
    opennessToLongDistance: boolean('openness_to_long_distance').default(false),

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
