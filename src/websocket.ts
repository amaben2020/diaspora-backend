import Ably from 'ably';
import { eq } from 'drizzle-orm';
import { db } from './db.ts';
import { userActivityTable } from './schema/userActivityTable.ts';

export const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

const channel = ably.channels.get('user-presence');

export async function updateUserStatus(userId: string, onlineStatus: boolean) {
  try {
    const [userOnlineStatus = undefined] = await db
      .select()
      .from(userActivityTable)
      .where(eq(userActivityTable.userId, userId));

    if (!userOnlineStatus?.userId) {
      // create the activity for the user
      await db.insert(userActivityTable).values({
        userId,
        onlineStatus,
        lastActive: new Date(),
      });
    } else {
      console.log('onlineStatus ===>', onlineStatus);
      // update the activity for the user
      await db
        .update(userActivityTable)
        .set({ onlineStatus, lastActive: new Date() })
        .where(eq(userActivityTable.userId, userId));
    }

    // Publish status update to Ably
    await channel.publish('onlineStatusUpdated', { userId, onlineStatus });
  } catch (error) {
    console.error('Database error:', error);
  }
}
