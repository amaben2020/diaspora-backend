import { eq } from 'drizzle-orm';
import { db } from '../db.ts';
import { likesTable } from '../schema/likesTable.ts';
import { dislikesTable } from '../schema/dislikeTable.ts';
import { matchesTable } from '../schema/matchesTable.ts';

export const getLikedOrDislikedUserIds = async (currentUserId: string) => {
  const likedUserIds = await db
    .select({ userId: likesTable.likedId })
    .from(likesTable)
    .where(eq(likesTable.likerId, currentUserId));

  const dislikedUserIds = await db
    .select({ userId: dislikesTable.dislikedId })
    .from(dislikesTable)
    .where(eq(dislikesTable.dislikerId, currentUserId));

  const matchedUserIds = await db
    .select({ userId: matchesTable.user1Id })
    .from(matchesTable)
    .where(eq(matchesTable.user2Id, currentUserId))
    .union(
      db
        .select({ userId: matchesTable.user2Id })
        .from(matchesTable)
        .where(eq(matchesTable.user1Id, currentUserId)),
    );

  return new Set([
    ...likedUserIds.map(({ userId }) => userId),
    ...dislikedUserIds.map(({ userId }) => userId),
    ...matchedUserIds.map(({ userId }) => userId), // Include matched users
  ]);
};
