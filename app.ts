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
import { logger } from './src/utils/logger.ts';

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
      message: err.message + 'Benneth',
      stack:
        process.env.NODE_ENV === 'development' ? err.statusCode : undefined,
    });
  },
);

const PORT = 8000;

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
