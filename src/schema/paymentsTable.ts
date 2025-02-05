import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const paymentsTable = pgTable(
  'payment',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').notNull().unique(),
    subscriptionType: varchar('subscription_type', { length: 20 }).default(
      'free',
    ),
    nextBillingDate: timestamp('next_billing_date', { withTimezone: true }),
    paymentStatus: varchar('payment_status', { length: 20 }).default('active'),

    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueUser: uniqueIndex('unique_payment').on(table.userId),
  }),
);

export const locationsRelations = relations(paymentsTable, ({ one }) => ({
  payment: one(usersTable, {
    fields: [paymentsTable.userId],
    references: [usersTable.id],
  }),
}));

export type InsertLocations = typeof paymentsTable.$inferInsert;
export type SelectLocations = typeof paymentsTable.$inferSelect;
