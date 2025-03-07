import { eq, and } from 'drizzle-orm';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { db } from '../../db.ts';
import { usersTable } from '../../schema/usersTable.ts';
import { dislikesTable } from '../../schema/dislikeTable.ts';
import { likesTable } from '../../schema/likesTable.ts';

export const dislikeUserController = tryCatchFn(async (req, res, next) => {
  const { dislikerId, dislikedId } = req.body;

  // Validate input
  if (!dislikerId || !dislikedId) {
    next('Error');
    res.status(400).json({ error: 'Missing dislikerId or dislikedId' });
  }

  // Check if both users exist before proceeding
  //TODO: Extract to a isUserExists helper
  const [dislikerExists = undefined] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, dislikerId))
    .limit(1);

  const [dislikedExists = undefined] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, dislikedId))
    .limit(1);

  if (!dislikerExists || !dislikedExists) {
    res.status(404).json({ error: 'One or both users do not exist' });
  }

  const existingLike = await db
    .select()
    .from(likesTable)
    .where(
      and(
        eq(likesTable.likerId, dislikerId),
        eq(likesTable.likedId, dislikedId),
      ),
    );

  if (existingLike.length > 0) {
    res.status(400).json({ error: 'Like already exists' });
  }

  // Check if the like already exists
  const existingDislike = await db
    .select()
    .from(dislikesTable)
    .where(
      and(
        eq(dislikesTable.dislikerId, dislikerId),
        eq(dislikesTable.dislikedId, dislikedId),
      ),
    );

  if (existingDislike.length > 0) {
    res.status(400).json({ error: 'Like already exists' });
  }

  // Insert the like into the database
  const [dislike = undefined] = await db
    .insert(dislikesTable)
    .values({ dislikerId, dislikedId })
    .returning();

  if (!dislike) {
    res.status(500).json({ error: 'Failed to create dislike' });
  }

  res.status(201).json(dislike);
});
