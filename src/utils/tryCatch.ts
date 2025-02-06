import type { AuthenticatedRequest } from '@/types/globals';
import { type NextFunction, type Request, type Response } from 'express';

export const tryCatchFn = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<Response>,
) => {
  return (
    req: Request | AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    fn(req, res, next).catch(next);
  };
};
