import { eq, and, sql } from 'drizzle-orm';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { db } from '../../db.ts';
import { matchesTable } from '../../schema/matchesTable.ts';
import { usersTable } from '../../schema/usersTable.ts';
import { likesTable } from '../../schema/likesTable.ts';
import { imagesTable } from '../../schema/imagesTable.ts';
import { admin } from './../../services/fcm.ts';

export const likeUserController = tryCatchFn(async (req, res, next) => {
  const { likerId, likedId, superLike = false } = req.body;

  // Validate input
  if (!likerId || !likedId) {
    next('Error');
    res.status(400).json({ error: 'Missing likerId or likedId' });
  }

  // Check if both users exist before proceeding
  // TODO: refactor to use isUserExist
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
    return res.status(404).json({ error: 'One or both users do not exist' });
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
    .values({ likerId, likedId, superLike })
    .returning();

  if (likedExists?.fcmToken) {
    const payload = {
      notification: {
        title: `New Like 💖 from ${likerExists.displayName}`,
        body: `${likerExists.displayName} just liked you! Open the app to check.`,
      },
      // the token belongs to who's being liked so they get the notification
      token: likedExists?.fcmToken,
    };

    try {
      await admin.messaging().send(payload);
      console.log(`Notification sent to ${likedExists.id}`);
    } catch (err) {
      console.error('Error sending FCM notification:', err);
    }
  }

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

export const getLikedUsersController = tryCatchFn(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const likedUsers = await db
      .select({
        likedId: likesTable.likedId,
        likedAt: likesTable.likedAt,
        superLike: likesTable.superLike,
        user: sql`json_build_object(
          'id', ${usersTable.id},
          'name', ${usersTable.displayName},
          'email', ${usersTable.email}
        )`,
        images: sql`COALESCE(
          (SELECT array_agg(${imagesTable.imageUrl})
           FROM ${imagesTable}
           WHERE ${imagesTable.userId} = ${likesTable.likedId}),
          ARRAY[]::text[]
        )`,
      })
      .from(likesTable)
      .where(eq(likesTable.likerId, userId))
      .leftJoin(usersTable, eq(likesTable.likedId, usersTable.id))
      .groupBy(
        likesTable.likedId,
        likesTable.likedAt,
        likesTable.superLike,
        usersTable.id,
        usersTable.displayName,
        usersTable.email,
      );

    res.status(200).json(likedUsers);
  } catch (error) {
    console.error('Error fetching liked users:', error);
    res.status(500).json({ error: 'Failed to fetch liked users' });
  }
});
