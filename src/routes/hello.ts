import type { AuthenticatedRequest } from '@/types/globals';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import express, { type Response } from 'express';

const router = express.Router();

router
  .route('/protected-auth-required')
  .get(
    ClerkExpressRequireAuth(),
    (req: AuthenticatedRequest, res: Response) => {
      console.log('Auth', req.auth);
      res.json({ user: req.auth, name: 'Ben' });
    },
  );

export default router;
