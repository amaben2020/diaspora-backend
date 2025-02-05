import { integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable';
import { relations } from 'drizzle-orm';

export const videoCallsTable = pgTable('video_calls', {
  id: serial('id').primaryKey(),
  callerId: text('caller_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('ongoing'), // ongoing, missed, ended
  duration: integer('duration').default(0),
});

export const videoCallsTableRelations = relations(
  videoCallsTable,
  ({ one }) => ({
    caller: one(usersTable, {
      fields: [videoCallsTable.callerId],
      references: [usersTable.id],
    }),
    receiver: one(usersTable, {
      fields: [videoCallsTable.receiverId],
      references: [usersTable.id],
    }),
  }),
);

export type InsertVideoCall = typeof videoCallsTable.$inferInsert;
export type SelectVideoCall = typeof videoCallsTable.$inferSelect;
