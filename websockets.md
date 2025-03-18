// import { WebSocketServer } from 'ws';

// import { eq } from 'drizzle-orm';
// import { db } from './src/db.ts';
// import { userActivityTable } from './src/schema/userActivityTable.ts';

// const wss = new WebSocketServer({ port: 8080 });

// wss.on('connection', (ws) => {
// console.log('Client connected ☘️');

// ws.on('message', async (message) => {
// try {
// const { userId, onlineStatus } = JSON.parse(message.toString());

// // TODO: ensure other user can view online status
// // Update user activity in DB
// try {
// const [userOnlineStatus = undefined] = await db
// .select()
// .from(userActivityTable)
// .where(eq(userActivityTable.userId, userId));

// if (!userOnlineStatus) {
// await db
// .insert(userActivityTable)
// .values({ userId, onlineStatus, lastActive: new Date() });
// } else {
// await db
// .update(userActivityTable)
// .set({ onlineStatus, lastActive: new Date() })
// .where(eq(userActivityTable.userId, userId));
// }
// } catch (error) {
// console.log(error);
// }

// // Broadcast updated status to all clients
// wss.clients.forEach((client) => {
// if (client.readyState === ws.OPEN) {
// client.send(
// JSON.stringify({
// userId,
// onlineStatus,
// type: 'onlineStatusUpdated',
// }),
// );
// }
// });
// } catch (error) {
// console.error('Error processing message:', error);
// }
// });

// ws.on('close', () => console.log('Client disconnected'));
// });

// export { wss };

// import { WebSocketServer } from 'ws';
// import { eq } from 'drizzle-orm';
// import { db } from './src/db.ts';
// import { userActivityTable } from './src/schema/userActivityTable.ts';
// import { Server } from 'http';

// export function setupWebSocket(server: Server) {
// const wss = new WebSocketServer({ server }); // Attach to existing server

// wss.on('connection', (ws) => {
// console.log('Client connected');

// ws.on('message', async (message) => {
// try {
// const { userId, onlineStatus } = JSON.parse(message.toString());

// // Update user activity in DB
// try {
// const [userOnlineStatus = undefined] = await db
// .select()
// .from(userActivityTable)
// .where(eq(userActivityTable.userId, userId));

// if (!userOnlineStatus) {
// await db
// .insert(userActivityTable)
// .values({ userId, onlineStatus, lastActive: new Date() });
// } else {
// await db
// .update(userActivityTable)
// .set({ onlineStatus, lastActive: new Date() })
// .where(eq(userActivityTable.userId, userId));
// }
// } catch (error) {
// console.error('Database error:', error);
// }

// // Broadcast updated status to all clients
// wss.clients.forEach((client) => {
// if (client.readyState === ws.OPEN) {
// client.send(
// JSON.stringify({
// userId,
// onlineStatus,
// type: 'onlineStatusUpdated',
// }),
// );
// }
// });
// } catch (error) {
// console.error('Error processing message:', error);
// }
// });

// ws.on('close', () => console.log('Client disconnected'));
// });

// console.log('WebSocket server is running');
// }

// import { WebSocketServer } from 'ws';

// const wss = new WebSocketServer({ port: 8080 });

// wss.on('connection', (ws) => {
// console.log('New client connected');

// ws.on('message', (message) => {
// console.log(`Received: ${message}`);
// });

// ws.on('close', () => {
// console.log('Client disconnected');
// });
// });

// console.log('WebSocket server is running on ws://localhost:8080');

/////////////////////////////LIKES/////////////////////////////////

// import { Server } from 'http';

// export function setupWebSocket(server: Server) {
// const wss = new WebSocketServer({ server });

// wss.on('connection', (ws) => {
// console.log('Client connected');

// ws.on('message', async (message) => {
// try {
// const data = JSON.parse(message.toString());

// if (data.type === 'like') {
// const { likerId, likedId } = data;

// // Broadcast the like to the liked user
// wss.clients.forEach((client) => {
// if (client.readyState === ws.OPEN) {
// client.send(
// JSON.stringify({
// type: 'like',
// likerId,
// likedId,
// }),
// );
// }
// });
// }
// } catch (error) {
// console.error('Error processing message:', error);
// }
// });

// ws.on('close', () => console.log('Client disconnected'));
// });

// console.log('WebSocket server is running');
// }

app.ts
// import express, {
// type NextFunction,
// type Request,
// type Response,
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
// // import { wss } from './websocket.ts';
// import { Server } from 'socket.io';
// // import io from 'socket.io';

// dotenv.config();

// export const app = express();

// const configPath = join(
// dirname(fileURLToPath(import.meta.url)),
// './swagger_output.json',
// );

// const swaggerFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// if (String(process.env.NODE_ENV) === 'development') {
// app.use(morgan('dev'));
// }

// // helmet for security
// app.use(helmet());

// // parsing the incoming Request Object without body parser
// app.use(express.json());

// // recognizes the incoming Request Object as strings or arrays
// app.use(
// express.urlencoded({
// extended: true,
// }),
// );

// // cookie parser for cookies during auth
// app.use(cookieParser());

// //swagger docs
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// // Middleware to log HTTP requests
// app.use(morganMiddleware);

// // Clerk auth middleware
// app.use(
// clerkMiddleware({
// secretKey: process.env.CLERK_SECRET_KEY,
// publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
// }),
// );

// // routes
// app.use('/api/v1', router);

// app.get('/api/v1/health', (req, res) => {
// res.json({
// status: 200,
// message: 'Running...',
// port: process.env.PORT,
// isDev: process.env.NODE_ENV === 'development',
// });
// });

// // 👇 add a global error handler after all the routes.
// app.use(
// (
// err: {
// status: string;
// statusCode: number;
// message: string;
// },
// req: Request,
// res: Response,
// next: NextFunction,
// ) => {
// err.status = err.status || 'fail';
// err.statusCode = err.statusCode || 500;

// res?.status(err.statusCode).json({
// status: err.status,
// // message: transformMessage(err.message),
// message: err.message + ' ' + 'Benneth',
// stack:
// process.env.NODE_ENV === 'development' ? err.statusCode : undefined,
// });
// },
// );
// const server = http.createServer(app);
// // Attach WebSocket to the same server
// // server.on('upgrade', (request, socket, head) => {
// // wss.handleUpgrade(request, socket, head, (ws) => {
// // wss.emit('connection', ws, request);
// // });
// // });

// const io = new Server(server, {
// cors: {
// origin: '\*',
// methods: ['GET', 'POST'],
// },
// });

// io.on('connection', (socket) => {
// console.log('A user connected:', socket.id);

// socket.on('disconnect', () => {
// console.log('User disconnected:', socket.id);
// });
// });

// // server.listen(process.env.PORT || 3000, function () {
// // const host = server.address();
// // // var port = server.address();
// // console.log(host);
// // console.log('App listening at https://%s:%s', host?.toString());
// // });

// // io.on('connection', function (socket) {
// // console.log('Client connected to the WebSocket');

// // socket.on('disconnect', () => {
// // console.log('Client disconnected');
// // });

// // socket.on('chat message', function (msg) {
// // console.log('Received a chat message');
// // io.emit('chat message', msg);
// // });
// // });

// const PORT = process.env.PORT || 8000;

// console.log('port====>', PORT);

// app.listen(8000, () => {
// logger.info(`Server is running on http://localhost:${PORT}`);
// });
