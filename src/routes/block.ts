// routes/moderation.ts
import { Router } from 'express';
import { db } from '../db.ts';
import { randomUUID } from 'crypto';
import { blocksTable } from '../schema/blockTable.ts';
import { and, eq } from 'drizzle-orm';
import { tryCatchFn } from '../utils/tryCatch.ts';
// import { redisClient } from '../utils/redis.ts';

const router = Router();

// Report a user

// Block a user
router.post(
  '/block',
  tryCatchFn(async (req, res) => {
    const { blockerId, blockedId } = req.body;

    // Invalidate all relevant cache keys
    // const pattern = `all-users-with-locations-${blockerId}-*`;
    // console.log(pattern);
    // await redisClient.del(pattern);

    // Validate input
    if (!blockerId || !blockedId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prevent self-blocks
    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if already blocked
    const existingBlock = await db
      .select()
      .from(blocksTable)
      .where(
        and(
          eq(blocksTable.blockerId, blockerId),
          eq(blocksTable.blockedId, blockedId),
        ),
      )
      .limit(1);

    if (existingBlock.length > 0) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    // Create block
    const block = await db
      .insert(blocksTable)
      .values({
        id: randomUUID(),
        blockerId,
        blockedId,
      })
      .returning();

    res.json({ success: true, block });
  }),
);

export default router;
