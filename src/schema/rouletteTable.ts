import { pgTable, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';

// Add these to your schema
export const rouletteSessionsTable = pgTable(
  'roulette_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => usersTable.id),
    status: varchar('status', {
      length: 20,
    }).$type<'waiting' | 'matched' | 'completed'>(),
    interests: text('interests').array(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    uniqueUser: unique().on(table.userId), // ✅ Add this
  }),
);

export const rouletteMatchesTable = pgTable('roulette_matches', {
  id: text('id').primaryKey(),
  session1Id: text('session1_id').references(() => rouletteSessionsTable.id),
  session2Id: text('session2_id').references(() => rouletteSessionsTable.id),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  roomId: text('room_id'), // For video call
});

// schema/rouletteTable.ts
