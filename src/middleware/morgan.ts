import morgan from 'morgan';
import { logger } from '../utils/logger.ts';
const stream = {
  write: (message: string) => logger.http(message),
};
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};
export const morganMiddleware = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip },
);
