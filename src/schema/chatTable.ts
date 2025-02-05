import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const chatsTable = pgTable('chats', {
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

export const chatsTableRelations = relations(chatsTable, ({ one }) => ({
  sender: one(usersTable, {
    fields: [chatsTable.senderId],
    references: [usersTable.id],
  }),
  receiver: one(usersTable, {
    fields: [chatsTable.receiverId],
    references: [usersTable.id],
  }),
}));

export type InsertMessage = typeof chatsTable.$inferInsert;
export type SelectMessage = typeof chatsTable.$inferSelect;
