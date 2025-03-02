import { eq, or } from 'drizzle-orm';
import { db } from '../db.ts';
import { likesTable } from '../schema/likesTable.ts';

export const getLikedOrDislikedUserIds = async (currentUserId: string) => {
  const likedUserIds = await db
    .select({ userId: likesTable.likedId || likesTable.likerId })
    .from(likesTable)
    .where(
      or(
        eq(likesTable.likedId, currentUserId),
        eq(likesTable.likerId, currentUserId),
      ),
    );

  // const dislikedUserIds = await db
  //   .select({ userId: dislikesTable.targetUserId })
  //   .from(dislikesTable)
  //   .where(eq(dislikesTable.userId, currentUserId));

  return new Set(
    // [...likedUserIds, ...dislikedUserIds].map(({ userId }) => userId),
    [...likedUserIds].map(({ userId }) => userId),
  );
};
