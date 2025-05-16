import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  varchar,
  index,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    displayName: varchar('display_name', { length: 50 }),
    email: text('email').unique(),
    gender: varchar('gender', { length: 20 }),
    birthday: date('birthday'),
    verified: boolean('verified').default(false),
    showGender: boolean('show_gender').default(false),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    subscriptionType: varchar('subscription_type', { length: 20 }).default(
      'free',
    ),
    phone: varchar('phone', { length: 11 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
    fcmToken: text('fcm_token'),
    streamToken: text('stream_token'),
  },
  (table) => ({
    // Essential query performance indexes
    emailIdx: index('email_idx').on(table.email), // Duplicate of unique but helps certain queries
    loginIdx: index('login_idx').on(table.lastLogin.desc()), // For active user queries
    displayNameIdx: index('displayName_idx').on(table.displayName), // For active user queries
    idIdx: index('id_idx').on(table.id), // For active user queries

    // Composite indexes for common filter combinations
    activeUsersIdx: index('active_users_idx').on(
      table.lastLogin.desc(),
      table.verified,
    ),

    subscriptionIdx: index('subscription_idx').on(
      table.subscriptionType,
      table.verified,
    ),

    // Geospatial/age filtering (assuming you'll add location data later)
    demographicIdx: index('demographic_idx').on(table.gender, table.birthday),
  }),
);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
