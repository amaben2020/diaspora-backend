import type { NextFunction } from 'express';
import { db } from '../db.ts';
import { eq, or } from 'drizzle-orm';
import { blocksTable } from '../schema/blockTable.ts';

export async function checkBlocked(
  req: Request & {
    query: {
      userId: string;
    };
    blockedUserIds?: string[];
  },
  res: Response,
  next: NextFunction,
) {
  try {
    const currentUserId = req?.query?.userId;

    const blockedList = await db
      .select()
      .from(blocksTable)
      .where(
        or(
          eq(blocksTable.blockedId, currentUserId),
          eq(blocksTable.blockerId, currentUserId),
        ),
      );

    // 3. Extract all blocked user IDs (both directions)
    const blockedUserIds = blockedList.map((rel) =>
      rel.blockerId === currentUserId ? rel.blockedId : rel.blockerId,
    );

    // 4. Attach to request for use in controller
    req.blockedUserIds = blockedUserIds as string[];

    next();
  } catch (error) {
    next(error);
  }
}
