// import { and, eq, ne } from 'drizzle-orm';
// import {
//   rouletteMatchesTable,
//   rouletteSessionsTable,
// } from '../schema/rouletteTable.ts';
// import { randomUUID } from 'crypto';
// import { db } from '../db.ts';

// export async function findMatch(userId: string) {
//   // 1. Create or update session atomically (if a session for the user does not exist, create one)
//   const [session] = await db
//     .insert(rouletteSessionsTable)
//     .values({
//       id: randomUUID(), // ✅ generate a unique ID
//       userId,
//       status: 'waiting',
//       createdAt: new Date(),
//     })
//     .onConflictDoUpdate({
//       target: rouletteSessionsTable.userId,
//       set: {
//         status: 'waiting',
//       },
//     })
//     .returning();

//   // 2. Find a compatible partner who is also 'waiting'
//   const partner = await db
//     .select()
//     .from(rouletteSessionsTable)
//     .where(
//       and(
//         eq(rouletteSessionsTable.status, 'waiting'), // Ensure the session is in waiting state
//         ne(rouletteSessionsTable.userId, userId), // Ensure the user is not matched with themselves
//       ),
//     )
//     .orderBy(rouletteSessionsTable.createdAt) // FIFO: pick the first created session
//     .limit(1);
//   // .forUpdate(); // Lock this row to prevent race conditions

//   if (!partner || partner.length === 0) {
//     return { matched: false };
//   }

//   // 3. Attempt to claim the partner (update their session status to 'matched')
//   const updatedPartner = await db
//     .update(rouletteSessionsTable)
//     .set({ status: 'matched' })
//     .where(
//       and(
//         eq(rouletteSessionsTable.id, partner[0].id),
//         eq(rouletteSessionsTable.status, 'waiting'), // Ensure they are still available for matching
//       ),
//     )
//     .returning();

//   // If the partner was claimed by someone else, retry or return failure
//   if (updatedPartner.length === 0) {
//     return { matched: false };
//   }

//   console.log('updatedPartner', updatedPartner);

//   // 4. Update our own session to 'matched'
//   await db
//     .update(rouletteSessionsTable)
//     .set({ status: 'matched' })
//     .where(eq(rouletteSessionsTable.id, session.id));

//   // 5. Create a match record (roomId is generated for the match)
//   const roomId = Math.random().toString(36).substring(7); // Using a random string as the room ID
//   await db.insert(rouletteMatchesTable).values({
//     id: randomUUID(),
//     session1Id: session.id,
//     session2Id: partner[0].id,
//     roomId,
//     startedAt: new Date(),
//   });

//   return {
//     matched: true,
//     roomId,
//     partnerId: partner[0].userId, // Return the partner's user ID
//   };
// }

// core/roulette.ts
import { and, eq, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db.ts';
import {
  rouletteMatchesTable,
  rouletteSessionsTable,
} from '../schema/rouletteTable.ts';

export async function findMatch(userId: string) {
  // 1. Create or update session
  const sessionId = randomUUID();
  const [session] = await db
    .insert(rouletteSessionsTable)
    .values({
      id: sessionId,
      userId,
      status: 'waiting',
    })
    .onConflictDoUpdate({
      target: rouletteSessionsTable.userId,
      set: {
        status: 'waiting',
        updatedAt: new Date(),
      },
    })
    .returning();

  // 2. Find compatible partner
  const partners = await db
    .select()
    .from(rouletteSessionsTable)
    .where(
      and(
        eq(rouletteSessionsTable.status, 'waiting'),
        ne(rouletteSessionsTable.userId, userId),
      ),
    )
    .orderBy(rouletteSessionsTable.createdAt)
    .limit(1);

  if (partners.length === 0) {
    return { matched: false };
  }

  const partner = partners[0];

  // 3. Claim the partner (atomic operation)
  const updatedPartner = await db
    .update(rouletteSessionsTable)
    .set({ status: 'matched' })
    .where(
      and(
        eq(rouletteSessionsTable.id, partner.id),
        eq(rouletteSessionsTable.status, 'waiting'),
      ),
    )
    .returning();

  if (updatedPartner.length === 0) {
    return { matched: false }; // Partner was already claimed
  }

  // 4. Update our session
  await db
    .update(rouletteSessionsTable)
    .set({ status: 'matched' })
    .where(eq(rouletteSessionsTable.id, session.id));

  // 5. Create match record
  const matchId = randomUUID();
  const roomId = randomUUID();
  await db.insert(rouletteMatchesTable).values({
    id: matchId,
    session1Id: session.id,
    session2Id: partner.id,
    roomId,
    startedAt: new Date(),
  });

  return {
    matched: true,
    roomId,
    partnerId: partner.userId,
    matchId,
  };
}
