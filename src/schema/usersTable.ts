import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  displayName: varchar('display_name', { length: 50 }),
  email: text('email').unique(),
  gender: varchar('gender', { length: 20 }),
  birthday: date('birthday'),
  verified: boolean('verified').default(false),
  onlineStatus: boolean('online_status').default(false),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  subscriptionType: varchar('subscription_type', { length: 20 }).default(
    'free',
  ),
  phone: varchar('phone', { length: 11 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
