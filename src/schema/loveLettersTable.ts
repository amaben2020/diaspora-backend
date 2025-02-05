import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const loveLettersTable = pgTable('love_letters', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  readStatus: boolean('read_status').default(false),
});

export const loveLettersTableRelations = relations(
  loveLettersTable,
  ({ one }) => ({
    sender: one(usersTable, {
      fields: [loveLettersTable.senderId],
      references: [usersTable.id],
    }),
    receiver: one(usersTable, {
      fields: [loveLettersTable.receiverId],
      references: [usersTable.id],
    }),
  }),
);

export type InsertLoveLetter = typeof loveLettersTable.$inferInsert;
export type SelectLoveLetter = typeof loveLettersTable.$inferSelect;
