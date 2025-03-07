import { eq, and } from 'drizzle-orm';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { db } from '../../db.ts';
import { matchesTable } from '../../schema/matchesTable.ts';
import { usersTable } from '../../schema/usersTable.ts';
import { likesTable } from '../../schema/likesTable.ts';

export const likeUserController = tryCatchFn(async (req, res, next) => {
  const { likerId, likedId } = req.body;

  // Validate input
  if (!likerId || !likedId) {
    next('Error');
    res.status(400).json({ error: 'Missing likerId or likedId' });
  }

  // Check if both users exist before proceeding
  const [likerExists] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, likerId))
    .limit(1);

  const [likedExists] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, likedId))
    .limit(1);

  if (!likerExists || !likedExists) {
    res.status(404).json({ error: 'One or both users do not exist' });
  }

  // Check if the like already exists
  const existingLike = await db
    .select()
    .from(likesTable)
    .where(
      and(eq(likesTable.likerId, likerId), eq(likesTable.likedId, likedId)),
    );

  if (existingLike.length > 0) {
    res.status(400).json({ error: 'Like already exists' });
  }

  // Insert the like into the database
  const [like = undefined] = await db
    .insert(likesTable)
    .values({ likerId, likedId })
    .returning();

  if (!like) {
    res.status(500).json({ error: 'Failed to create like' });
  }

  // Check for a match (if the liked user has also liked the liker)
  const match = await db
    .select()
    .from(likesTable)
    .where(
      and(eq(likesTable.likerId, likedId), eq(likesTable.likedId, likerId)),
    );

  console.log('MATCH', match);

  if (match.length > 0) {
    // Create a match record
    const [newMatch = undefined] = await db
      .insert(matchesTable)
      .values({
        user1Id: likerId,
        user2Id: likedId,
      })
      .returning();

    if (!newMatch) {
      res.status(500).json({ error: 'Failed to create match' });
    }

    // Notify both users of the match (e.g., using WebSocket or a notification service)
    console.log("It's a match!", { likerId, likedId });

    // Example WebSocket notification
    const matchMessage = JSON.stringify({
      type: 'match',
      message: "It's a match!",
      user1Id: likerId,
      user2Id: likedId,
    });
    console.log(matchMessage);

    // Broadcast the match message to both users
    // TODO: Broadcast with websocket
    // wss.clients.forEach((client) => {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(matchMessage);
    //   }
    // });

    res.status(201).json({ like, match: newMatch });
  }

  res.status(201).json(like);
});
