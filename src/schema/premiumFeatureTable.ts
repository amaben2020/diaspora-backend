import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';

//TODO: Ensure paid users are up
export const premiumFeaturesTable = pgTable('premium_features', {
  userId: text('user_id')
    .primaryKey()
    .references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
  visibilityBoost: boolean('visibility_boost').default(false),
  lastBoostedAt: timestamp('last_boosted_at'),
  expiresAt: timestamp('expires_at'),
});
