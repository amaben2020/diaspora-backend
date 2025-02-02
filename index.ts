import express, { type Request, type Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import {
  ClerkExpressRequireAuth,
  ClerkExpressWithAuth,
} from '@clerk/clerk-sdk-node';
import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import 'dotenv/config';
import { morganMiddleware } from './src/middleware/morgan.ts';
import { logger } from './src/utils/logger.ts';

import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import router from './src/routes/index.ts';

const configPath = join(
  dirname(fileURLToPath(import.meta.url)),
  './swagger_output.json'
);
const swaggerFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();

// Middleware to log HTTP requests
app.use(morganMiddleware);

// Clerk auth middleware
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })
);

// app.get(
//   '/protected-auth-required',
//   ClerkExpressRequireAuth(),
//   (req: Request, res: Response) => {
//     res.json(req.auth);
//   }
// );

// app.get('/protected-auth-optional', ClerkExpressWithAuth(), (req, res) => {
//   res.json(req.auth);
//   console.log('oti lo', req.auth);
// });

// Swagger docs
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// All routes have access to the auth based on token
// app.get('/api/protected', (req, res) => {
//   if (!req.auth.userId) {
//     console.log('req.auth.userId', req.auth.userId);
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   res.json({ message: 'Protected route', user: req.auth });
//   console.log(req.auth);
// });

// app.get('/protected', requireAuth(), (req, res) => {
//   res.send('Protected data');
//   console.log(req.auth);
//   logger.info(req.auth);
// });

// app.get('/user', requireAuth(), (req, res) => {
//   const user = req.auth;
//   console.log('user', user);
//   res.json({ user });
// });

// app.get('/', (req, res) => {
//   res.send('Running');
// });

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error');
});

app.use('/api/v1', router);

const PORT = 8000;

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
