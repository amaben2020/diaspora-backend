import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';
import { relations } from 'drizzle-orm';

export const imagesTable = pgTable('images', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  order: integer('order').notNull().default(1),
});

export const imagesRelations = relations(imagesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [imagesTable.userId],
    references: [usersTable.id],
  }),
}));

export type InsertImages = typeof imagesTable.$inferInsert;
export type SelectImages = typeof imagesTable.$inferSelect;
