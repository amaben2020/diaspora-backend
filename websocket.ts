import { WebSocketServer } from 'ws';

import { eq } from 'drizzle-orm';
import { db } from './src/db.ts';
import { userActivityTable } from './src/schema/userActivityTable.ts';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const { userId, onlineStatus } = JSON.parse(message.toString());

      // do a join with the user here to return proper data
      // id: '3',
      // image: images.barney,
      // title: 'Rebecca',
      // distance: '5 km away',
      // gender: 'She/Her',
      // status: 'Online',
      // country: 'CA',
      // isVerified: true,
      // age: 25,

      // TODO: ensure other user can view online status
      // Update user activity in DB
      try {
        const [userOnlineStatus = undefined] = await db
          .select()
          .from(userActivityTable)
          .where(eq(userActivityTable.userId, userId));

        if (!userOnlineStatus) {
          await db
            .insert(userActivityTable)
            .values({ userId, onlineStatus, lastActive: new Date() });
        } else {
          await db
            .update(userActivityTable)
            .set({ onlineStatus, lastActive: new Date() })
            .where(eq(userActivityTable.userId, userId));
        }
      } catch (error) {
        console.log(error);
      }

      // Broadcast updated status to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(
            JSON.stringify({
              userId,
              onlineStatus,
              type: 'onlineStatusUpdated',
            }),
          );
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

export { wss };
