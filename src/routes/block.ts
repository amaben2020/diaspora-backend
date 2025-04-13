import { Router } from 'express';
import { db } from '../db.ts';
import { randomUUID } from 'crypto';
import { blocksTable } from '../schema/blockTable.ts';
import { and, eq } from 'drizzle-orm';
import { tryCatchFn } from '../utils/tryCatch.ts';
import { invalidateUserCache } from '../utils/invalidateCache.ts';

const router = Router();

// Report a user

// Block a user
router.post(
  '/block',
  tryCatchFn(async (req, res) => {
    const { blockerId, blockedId } = req.body;

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
    // After successful block, invalidate cache
    await invalidateUserCache(blockerId);
    res.json({ success: true, block });
  }),
);

export default router;
