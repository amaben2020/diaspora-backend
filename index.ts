import express from 'express';
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
// import swaggerFile from './swagger_output.json';
// import swaggerFile from './swagger_output.json' assert { type: 'json' };

const app = express();

// Swagger setup: move to another file
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Diaspora',
      version: '1.0.0',
      description: 'API documentation for Diaspora',
    },
    servers: [
      {
        url: 'http://localhost:8000',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/routes/*.ts'],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

// Middleware to log HTTP requests
app.use(morganMiddleware);

// Clerk auth middleware
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })
);

app.get(
  '/protected-auth-required',
  ClerkExpressRequireAuth(),
  (req: express.Request, res) => {
    res.json(req.auth);
  }
);

app.get('/protected-auth-optional', ClerkExpressWithAuth(), (req, res) => {
  res.json(req.auth);
  console.log('oti lo', req.auth);
});

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// All routes have access to the auth based on token
app.get('/api/protected', (req, res) => {
  if (!req.auth.userId) {
    console.log('req.auth.userId', req.auth.userId);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({ message: 'Protected route', user: req.auth });
  console.log(req.auth);
});

app.get('/protected', requireAuth(), (req, res) => {
  res.send('Protected data');
  console.log(req.auth);
  logger.info(req.auth);
});

app.get('/user', requireAuth(), (req, res) => {
  const user = req.auth;
  console.log('user', user);
  res.json({ user });
});

app.get('/', (req, res) => {
  res.send('Running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error');
});

const PORT = 8000;

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
