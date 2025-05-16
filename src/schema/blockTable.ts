// import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
// import { usersTable } from './usersTable.ts';

// export const blocksTable = pgTable('blocks', {
//   id: text('id').primaryKey(),
//   blockerId: text('blocker_id').references(() => usersTable.id),
//   blockedId: text('blocked_id').references(() => usersTable.id),
//   createdAt: timestamp('created_at').defaultNow(),
// });

import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { usersTable } from './usersTable.ts';

export const blocksTable = pgTable(
  'blocks',
  {
    id: text('id').primaryKey(),
    blockerId: text('blocker_id').references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
    blockedId: text('blocked_id').references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    // Index for checking if blocker has blocked someone
    blockerIdx: index('blocker_idx').on(table.blockerId),

    // Index for checking if user is blocked by someone
    blockedIdx: index('blocked_idx').on(table.blockedId),

    // Composite index for bidirectional block checks
    blockRelationshipIdx: index('block_relationship_idx').on(
      table.blockerId,
      table.blockedId,
    ),

    // Composite index for reverse lookup
    reverseBlockRelationshipIdx: index('reverse_block_relationship_idx').on(
      table.blockedId,
      table.blockerId,
    ),
  }),
);
