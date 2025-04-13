// routes/moderation.ts
import { Router } from 'express';
import { db } from '../db.ts';
import { randomUUID } from 'crypto';
import { blocksTable } from '../schema/blockTable.ts';
import { and, eq } from 'drizzle-orm';

const router = Router();

// Report a user

// Block a user
router.post('/block', async (req, res) => {
  const { blockerId, blockedId } = req.body;

  try {
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
  } catch (error) {
    console.error('Block error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

export default router;
