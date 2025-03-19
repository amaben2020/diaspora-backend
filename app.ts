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
import { updateUserStatus } from './websocket.ts';
import Ably from 'ably';

dotenv.config();

export const app = express();

const configPath = join(
  dirname(fileURLToPath(import.meta.url)),
  './swagger_output.json',
);
const swaggerFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (String(process.env.NODE_ENV) === 'development') {
  app.use(morgan('dev'));
}

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
app.use(
  (
    err: { status: string; statusCode: number; message: string },
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    err.status = err.status || 'fail';
    err.statusCode = err.statusCode || 500;

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message + ' ' + 'Benneth',
      stack:
        process.env.NODE_ENV === 'development' ? err.statusCode : undefined,
    });
  },
);
