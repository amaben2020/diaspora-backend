import type { AuthenticatedRequest } from '@/types/globals';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import express, { type Response } from 'express';

const router = express.Router();

router
  .route('/protected-auth-required')
  .get(
    ClerkExpressRequireAuth(),
    (req: AuthenticatedRequest, res: Response) => {
      res.json(req.auth);
    }
  );

export default router;
