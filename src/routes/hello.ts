import type { AuthenticatedRequest } from '@/types/globals';
import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import express, { type Response } from 'express';
import { logger } from '../utils/logger.ts';

const router = express.Router();
router
  .route('/protected-auth-required')
  .get(clerkMiddleware(), (req: AuthenticatedRequest, res: Response) => {
    console.log('Auth', req.auth);
    res.json({ user: req.auth, name: 'Ben' });
  });

router.route('/protected').get(requireAuth(), async (req, res) => {
  const data = await getAuth(req);

  console.log(req.auth);
  logger.info(req.auth);
  res.status(201).json({ data, auth: req.auth });
});

router
  .route('/')
  .get(clerkMiddleware(), (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Running', auth: req.auth });
  });

export default router;
