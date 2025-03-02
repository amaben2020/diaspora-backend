import { WebSocketServer } from 'ws';

import { eq } from 'drizzle-orm';
import { db } from './src/db.ts';
import { userActivityTable } from './src/schema/userActivityTable.ts';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected ☘️');

  ws.on('message', async (message) => {
    try {
      const { userId, onlineStatus } = JSON.parse(message.toString());

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

// import { WebSocketServer } from 'ws';
// import { eq } from 'drizzle-orm';
// import { db } from './src/db.ts';
// import { userActivityTable } from './src/schema/userActivityTable.ts';
// import { Server } from 'http';

// export function setupWebSocket(server: Server) {
//   const wss = new WebSocketServer({ server }); // Attach to existing server

//   wss.on('connection', (ws) => {
//     console.log('Client connected');

//     ws.on('message', async (message) => {
//       try {
//         const { userId, onlineStatus } = JSON.parse(message.toString());

//         // Update user activity in DB
//         try {
//           const [userOnlineStatus = undefined] = await db
//             .select()
//             .from(userActivityTable)
//             .where(eq(userActivityTable.userId, userId));

//           if (!userOnlineStatus) {
//             await db
//               .insert(userActivityTable)
//               .values({ userId, onlineStatus, lastActive: new Date() });
//           } else {
//             await db
//               .update(userActivityTable)
//               .set({ onlineStatus, lastActive: new Date() })
//               .where(eq(userActivityTable.userId, userId));
//           }
//         } catch (error) {
//           console.error('Database error:', error);
//         }

//         // Broadcast updated status to all clients
//         wss.clients.forEach((client) => {
//           if (client.readyState === ws.OPEN) {
//             client.send(
//               JSON.stringify({
//                 userId,
//                 onlineStatus,
//                 type: 'onlineStatusUpdated',
//               }),
//             );
//           }
//         });
//       } catch (error) {
//         console.error('Error processing message:', error);
//       }
//     });

//     ws.on('close', () => console.log('Client disconnected'));
//   });

//   console.log('WebSocket server is running');
// }

///////////////////////////////LIKES/////////////////////////////////

// import { Server } from 'http';

// export function setupWebSocket(server: Server) {
//   const wss = new WebSocketServer({ server });

//   wss.on('connection', (ws) => {
//     console.log('Client connected');

//     ws.on('message', async (message) => {
//       try {
//         const data = JSON.parse(message.toString());

//         if (data.type === 'like') {
//           const { likerId, likedId } = data;

//           // Broadcast the like to the liked user
//           wss.clients.forEach((client) => {
//             if (client.readyState === ws.OPEN) {
//               client.send(
//                 JSON.stringify({
//                   type: 'like',
//                   likerId,
//                   likedId,
//                 }),
//               );
//             }
//           });
//         }
//       } catch (error) {
//         console.error('Error processing message:', error);
//       }
//     });

//     ws.on('close', () => console.log('Client disconnected'));
//   });

//   console.log('WebSocket server is running');
// }
