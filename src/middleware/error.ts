//  Error-Handling Middleware: Error-handling middleware is used to catch errors that occur during the processing of a request. It has four parameters (err, req, res, next) and is defined with the app.use() method. https://verpex.com/blog/website-tips/middleware-in-express-js

import type { NextFunction, Response, Request } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  status: string;
  statusCode: number;
  isOperational: boolean;
  path?: string;
  value?: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleZodError = (err: ZodError) => {
  const issues = err.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  const message = `Validation error: ${issues.map((i) => `${i.path}: ${i.message}`).join(', ')}`;
  return new AppError(message, 400);
};

// Send appropriate error in production environment
const sendErrorProd = (err, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for developer
    console.error('ERROR 💥', err);

    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};
// Send detailed error in development environment
const sendErrorDev = (err, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
const environment = process.env.NODE_ENV || 'development';

export const errorMiddleware = (
  error: { status: string; statusCode: number; message: string },
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    error.status = error.status || 'fail';
    error.statusCode = error.statusCode || 500;
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      error = handleZodError(error);
    }

    // Send appropriate response based on environment
    if (environment === 'development') {
      sendErrorDev(error, res);
    } else {
      sendErrorProd(error, res);
    }

    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message + ' ' + 'Benneth',
      stack:
        process.env.NODE_ENV === 'development' ? error.statusCode : undefined,
    });
  } catch (error) {
    console.log('ERROR', error);
    next(error);
  }
};
