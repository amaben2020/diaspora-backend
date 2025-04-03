import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { usersTable } from './usersTable.ts';

export const favoritesTable = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  favoriteUserId: text('favorite_user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const favoritesRelations = relations(favoritesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [favoritesTable.userId],
    references: [usersTable.id],
  }),
  favoriteUser: one(usersTable, {
    fields: [favoritesTable.favoriteUserId],
    references: [usersTable.id],
  }),
}));
