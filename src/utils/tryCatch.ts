import type { AuthenticatedRequest } from '@/types/globals';
import { type NextFunction, type Request, type Response } from 'express';

export type TRequest = Request & {
  query?: {
    userId?: string;
  };
  blockedUserIds?: string[];
};

export const tryCatchFn = (
  fn: (
    req: TRequest,
    res: Response,
    next: NextFunction,
  ) => Promise<void | unknown>,
) => {
  return (
    req: Request | AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    fn(req, res, next).catch(next);
  };
};
