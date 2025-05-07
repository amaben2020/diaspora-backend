import { profileViewsTable } from './src/schema/profileViews.ts';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import router from './src/routes/index.ts';
import { morganMiddleware } from './src/middleware/morgan.ts';
import { clerkMiddleware } from '@clerk/express';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ably from 'ably';
import cron from 'node-cron';
import { db } from './src/db.ts';
import { lt } from 'drizzle-orm';
import { updateUserStatus } from './src/websocket.ts';
// import { createBullBoard } from '@bull-board/api';
// import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
// import { ExpressAdapter } from '@bull-board/express';
// import { emailQueue } from './src/services/bullMq.ts';
import { errorMiddleware } from './src/middleware/error.ts';

dotenv.config();

export const app = express();

const configPath = join(
  dirname(fileURLToPath(import.meta.url)),
  './swagger_output.json',
);

// const serverAdapter = new ExpressAdapter();

// serverAdapter.setBasePath('/admin');

const swaggerFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (String(process.env.NODE_ENV) === 'development') app.use(morgan('dev'));

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(morganMiddleware);

// Clerk auth middleware
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }),
);

app.use('/api/v1', router);

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 200,
    message: 'Running...',
    port: process.env.PORT,
    isDev: process.env.NODE_ENV === 'development',
  });
});

// ✅ Initialize Ably Realtime
const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

const channel = ably.channels.get('user-presence');
// ✅ Subscribe to presence updates
channel.presence.subscribe('enter', async (member) => {
  console.log(`${member.clientId} is online`);
  await updateUserStatus(member.clientId, true);
});

channel.presence.subscribe('leave', async (member) => {
  console.log(`${member.clientId} is offline`);
  await updateUserStatus(member.clientId, false);
});

// 👇 Add global error handler
app.use(errorMiddleware);

// createBullBoard({
//   queues: [new BullMQAdapter(emailQueue)],
//   serverAdapter: serverAdapter,
// });

// app.use('/admin', serverAdapter.getRouter());

// extract and modularize: profile views table cleared after one week
// Run every Sunday at 2 AM: https://www.npmjs.com/package/node-cron
cron.schedule('0 2 * * 0', async () => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    await db
      .delete(profileViewsTable)
      .where(lt(profileViewsTable.viewedAt, oneWeekAgo));

    console.log('Cleared old profile views');
  } catch (error) {
    console.error('Failed to clear old profile views:', error);
  }
});

// cron.schedule('* * * * * *', async () => {
//   try {
//     const oneWeekAgo = new Date();
//     oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

// await db
//   .delete(profileViewsTable)
//   .where(lt(profileViewsTable.viewedAt, oneWeekAgo));

//     console.log('Cleared old profile views');
//   } catch (error) {
//     console.error('Failed to clear old profile views:', error);
//   }
// });

// // Every 3 days
// myQueue.add(
//   "job_name",
//   {
//     /* your job data here */
//   },
//   {
//     repeat: {
//       cron: "0 0 */3 * *",
//     },
//   }
// );

// // Every 3 weeks
// myQueue.add(
//   "job_name",
//   {
//     /* your job data here */
//   },
//   {
//     repeat: {
//       cron: "0 0 */21 * *",
//     },
//   }
// );
