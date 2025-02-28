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
import http from 'http';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './src/utils/logger.ts';
// import { wss } from './websocket.ts';
import { Server } from 'socket.io';

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

// helmet for security
app.use(helmet());

// parsing the incoming Request Object without body parser
app.use(express.json());

// recognizes the incoming Request Object as strings or arrays
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// cookie parser for cookies during auth
app.use(cookieParser());

//swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Middleware to log HTTP requests
app.use(morganMiddleware);

// Clerk auth middleware
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }),
);

// routes
app.use('/api/v1', router);

app.get('/api/test', (req, res) => {
  res.json({
    status: 200,
    message: 'Running...',
    port: process.env.PORT,
    isDev: process.env.NODE_ENV === 'development',
  });
});

// 👇 add a global error handler after all the routes.
app.use(
  (
    err: {
      status: string;
      statusCode: number;
      message: string;
    },
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    err.status = err.status || 'fail';
    err.statusCode = err.statusCode || 500;

    res?.status(err.statusCode).json({
      status: err.status,
      // message: transformMessage(err.message),
      message: err.message + ' ' + 'Benneth',
      stack:
        process.env.NODE_ENV === 'development' ? err.statusCode : undefined,
    });
  },
);
const server = http.createServer(app);
// Attach WebSocket to the same server
// server.on('upgrade', (request, socket, head) => {
//   wss.handleUpgrade(request, socket, head, (ws) => {
//     wss.emit('connection', ws, request);
//   });
// });

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 8000;

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

// import express, {
//   type NextFunction,
//   type Request,
//   type Response,
// } from 'express';
// import dotenv from 'dotenv';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import cookieParser from 'cookie-parser';
// import router from './src/routes/index.ts';
// import { morganMiddleware } from './src/middleware/morgan.ts';
// import { clerkMiddleware } from '@clerk/express';
// import swaggerUi from 'swagger-ui-express';
// import http from 'http';
// import fs from 'node:fs';
// import { dirname, join } from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { logger } from './src/utils/logger.ts';
// import { setupWebSocket } from './websocket.ts'; // Import WebSocket setup function

// dotenv.config();

// export const app = express();

// const configPath = join(
//   dirname(fileURLToPath(import.meta.url)),
//   './swagger_output.json',
// );
// const swaggerFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// if (String(process.env.NODE_ENV) === 'development') {
//   app.use(morgan('dev'));
// }

// app.use(helmet());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
// app.use(morganMiddleware);

// // Clerk auth middleware
// app.use(
//   clerkMiddleware({
//     secretKey: process.env.CLERK_SECRET_KEY,
//     publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
//   }),
// );

// app.use('/api/v1', router);

// app.get('/api/test', (req, res) => {
//   res.json({
//     status: 200,
//     message: 'Running...',
//     port: process.env.PORT,
//     isDev: process.env.NODE_ENV === 'development',
//   });
// });

// // 👇 Add global error handler
// app.use(
//   (
//     err: { status: string; statusCode: number; message: string },
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ) => {
//     err.status = err.status || 'fail';
//     err.statusCode = err.statusCode || 500;

//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message + ' ' + 'Benneth',
//       stack:
//         process.env.NODE_ENV === 'development' ? err.statusCode : undefined,
//     });
//   },
// );

// // Create HTTP server and attach WebSocket
// const server = http.createServer(app);

// setupWebSocket(server); // ✅ Attach WebSocket to the Express server

// const PORT = process.env.PORT || 8000;
// server.listen(PORT, () => {
//   logger.info(`Server is running on http://localhost:${PORT}`);
// });

// // Handle server shutdown gracefully
// process.on('SIGINT', () => {
//   logger.info('Shutting down server...');
//   server.close(() => {
//     logger.info('Server has been shut down.');
//     process.exit(0);
//   });
// });
