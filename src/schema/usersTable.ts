import {
  boolean,
  date,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('id').primaryKey(),
  displayName: varchar('display_name', { length: 50 }),
  email: text('email').unique().notNull(),
  gender: varchar('gender', { length: 20 }).notNull(),
  birthday: date('birthday').notNull(),
  verified: boolean('verified').default(false),
  onlineStatus: boolean('online_status').default(false),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  subscriptionType: varchar('subscription_type', { length: 20 }).default(
    'free',
  ),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
