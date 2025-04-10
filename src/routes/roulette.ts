import { Router } from 'express';
import { eq } from 'drizzle-orm';
import {
  rouletteSessionsTable,
  // rouletteMatchesTable,
} from '../schema/rouletteTable.ts';
import { db } from '../db.ts';
import { findMatch } from '../core/roulette.ts';

const rouletteRouter = Router();

// 1. Start Roulette Session
rouletteRouter.post('/roulette/start', async (req, res) => {
  // TODO: Extract controllers
  const { userId } = req.body;

  try {
    const result = await findMatch(userId);
    console.log('result', result);
    res.json(result);
  } catch (error) {
    console.error('Roulette start error:', error);
    res.status(500).json({ error: 'Failed to start roulette' });
  }
});

// 2. End Roulette Session
// router.post('/roulette/end', async (req, res) => {
//   const { matchId } = req.body;

//   try {
//     await endSession(matchId);
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Roulette end error:', error);
//     res.status(500).json({ error: 'Failed to end session' });
//   }
// });

// 3. Get Session Status
rouletteRouter.get('/roulette/status/:userId', async (req, res) => {
  try {
    // const session = await db.query.rouletteSessionsTable.findFirst({
    //   where: eq(rouletteSessionsTable.userId, req.params.userId),
    //   with: {
    //     match: true,
    //     user: {
    //       columns: {
    //         displayName: true,
    //         avatarUrl: true,
    //       },
    //     },
    //   },
    // });

    const [session = undefined] = await db
      .select()
      .from(rouletteSessionsTable)
      .where(eq(rouletteSessionsTable.userId, req.params.userId));
    console.log('session ===>', session);
    res.json(session);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// 4. Cancel Roulette Search
rouletteRouter.post('/roulette/cancel', async (req, res) => {
  const { userId } = req.body;

  try {
    await db
      .delete(rouletteSessionsTable)
      .where(eq(rouletteSessionsTable.userId, userId));

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel search' });
  }
});

// 5. Get Match History
// router.get('/roulette/history/:userId', async (req, res) => {
//   try {
//     const matches = await db.query.rouletteMatchesTable.findMany({
//       where: or(
//         eq(rouletteMatchesTable.session1Id,
//           db.select({ id: rouletteSessionsTable.id })
//             .from(rouletteSessionsTable)
//             .where(eq(rouletteSessionsTable.userId, req.params.userId)),
//         eq(rouletteMatchesTable.session2Id,
//           db.select({ id: rouletteSessionsTable.id })
//             .from(rouletteSessionsTable)
//             .where(eq(rouletteSessionsTable.userId, req.params.userId))
//       ),
//       with: {
//         session1: {
//           with: { user: true }
//         },
//         session2: {
//           with: { user: true }
//         }
//       },
//       orderBy: desc(rouletteMatchesTable.startedAt),
//       limit: 20
//     });

//     res.json(matches);
//   } catch (error) {
//     console.error('History error:', error);
//     res.status(500).json({ error: 'Failed to get history' });
//   }
// });

// Helper Functions
// async function endSession(matchId: string) {
//   const [match] = await db
//     .update(rouletteMatchesTable)
//     .set({
//       endedAt: new Date(),
//       // duration: sql`EXTRACT(EPOCH FROM (NOW() - started_at))::int`
//     })
//     .where(eq(rouletteMatchesTable.id, matchId))
//     .returning();

//   await Promise.all([
//     db
//       .update(rouletteSessionsTable)
//       .set({ status: 'completed' })
//       .where(eq(rouletteSessionsTable.id, match.session1Id)),
//     db
//       .update(rouletteSessionsTable)
//       .set({ status: 'completed' })
//       .where(eq(rouletteSessionsTable.id, match.session2Id)),
//   ]);
// }

export default rouletteRouter;
