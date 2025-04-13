import { eq } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { db } from '../db.ts';
import { premiumFeaturesTable } from '../schema/premiumFeatureTable.ts';

const router = Router();
// TODO: Refactor endpoint
router.post('/boost/:userId', async (request: Request, res: Response) => {
  try {
    const { userId } = await request.params;

    if (!userId) {
      return res.json({ error: 'User ID is required' });
    }

    // Check if user already has premium
    const [existingPremium] = await db
      .select()
      .from(premiumFeaturesTable)
      .where(eq(premiumFeaturesTable.userId, userId))
      .limit(1);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // TODO: Use upsert
    if (existingPremium) {
      // Update existing premium
      const [updatedPremium] = await db
        .update(premiumFeaturesTable)
        .set({
          visibilityBoost: true,
          expiresAt,
        })
        .where(eq(premiumFeaturesTable.userId, userId))
        .returning();

      return res.json(updatedPremium);
    } else {
      // Create new premium entry
      const [newPremium] = await db
        .insert(premiumFeaturesTable)
        .values({
          userId,
          visibilityBoost: true,
          expiresAt,
          // any other required fields
        })
        .returning();

      return res.json(newPremium);
    }
  } catch (error) {
    console.error('Boost error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
