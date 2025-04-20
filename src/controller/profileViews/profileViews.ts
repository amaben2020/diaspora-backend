import { usersTable } from '../../schema/usersTable.ts';
import { db } from '../../db.ts';
import { and, desc, eq, lt } from 'drizzle-orm';
import { profileViewsTable } from '../../schema/profileViews.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { z } from 'zod';
import { ably } from '../../websocket.ts';
import { imagesTable } from '../../schema/imagesTable.ts';
import { isUserExists } from '../../core/user.ts';

const recordProfileViewSchema = z.object({
  viewerId: z.string(),
  viewedId: z.string(),
});

export const recordProfileViewController = tryCatchFn(async (req, res) => {
  const { viewerId, viewedId } = recordProfileViewSchema.parse(req.body);

  if (!viewerId || !viewedId) {
    return res.status(400).json({ error: 'Missing viewerId or viewedId' });
  }

  if (viewerId === viewedId) {
    return res.status(400).json({ error: 'Cannot view your own profile' });
  }

  try {
    // Check if users exist
    const [viewerExists = undefined] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, viewerId))
      .limit(1);

    const [viewedExists = undefined] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, viewedId))
      .limit(1);

    if (!viewerExists || !viewedExists) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    // Upsert the view record so that multiple views dont break the UI, very smart
    const [view] = await db
      .insert(profileViewsTable)
      .values({ viewerId, viewedId })
      .onConflictDoUpdate({
        target: [profileViewsTable.viewerId, profileViewsTable.viewedId],
        set: { viewedAt: new Date(), isNew: true },
      })
      .returning();

    // const [view] = await db
    //   .insert(profileViewsTable)
    //   .values({
    //     viewerId: viewerId, // Check the exact column name
    //     viewedId: viewedId, // Confirm this matches your schema
    //     viewedAt: new Date(),
    //     isNew: true,
    //   })
    //   .returning();

    // Send real-time notification
    try {
      const channel = ably.channels.get(`user:${viewedId}:views`);
      await channel.publish('new-view', {
        viewerId,
        viewedId,
        viewedAt: view.viewedAt,
        viewerName: viewerExists.displayName,
        viewerImage: viewerExists.displayName,
      });
    } catch (ablyError) {
      console.error('Ably notification failed:', ablyError);
    }

    return res.status(201).json(view);
  } catch (error) {
    console.error('Error recording profile view:', error);
    return res.status(500).json({ error: 'Failed to record profile view' });
  }
});

const getProfileViewSchema = z.object({
  userId: z.string(),
});
export const getProfileViewsController = tryCatchFn(async (req, res) => {
  const { userId } = getProfileViewSchema.parse(req.params);

  const { limit = 20, offset = 0 } = req.query;

  const isExist = await isUserExists(userId);

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  if (!isExist) {
    return res.status(400).json({ error: 'User does not exist' });
  }

  try {
    // Get views with viewer details
    const views = await db
      .select({
        viewer: {
          id: usersTable.id,
          displayName: usersTable.displayName,
          image: imagesTable.imageUrl,
        },
        viewedAt: profileViewsTable.viewedAt,
        isNew: profileViewsTable.isNew,
      })
      .from(profileViewsTable)
      .where(eq(profileViewsTable.viewedId, userId))
      .leftJoin(usersTable, eq(profileViewsTable.viewerId, usersTable.id))
      .leftJoin(imagesTable, eq(profileViewsTable.viewerId, imagesTable.userId))
      .orderBy(desc(profileViewsTable.viewedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Mark views as seen if requested
    if (req.query.markAsSeen === 'true') {
      await db
        .update(profileViewsTable)
        .set({ isNew: false })
        .where(
          and(
            eq(profileViewsTable.viewedId, userId),
            eq(profileViewsTable.isNew, true),
          ),
        );
    }

    return res.status(200).json(views);
  } catch (error) {
    console.error('Error fetching profile views:', error);
    return res.status(500).json({ error: 'Failed to fetch profile views' });
  }
});

export const clearOldProfileViewsController = tryCatchFn(async (req, res) => {
  try {
    // Delete views older than 1 week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await db
      .delete(profileViewsTable)
      .where(lt(profileViewsTable.viewedAt, oneWeekAgo));

    return res.status(200).json({ deletedCount: result.rowCount });
  } catch (error) {
    console.error('Error clearing old profile views:', error);
    return res.status(500).json({ error: 'Failed to clear old profile views' });
  }
});
