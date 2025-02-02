import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import express from 'express';

const router = express.Router();

router
  .route('/protected-auth-required')
  .get(ClerkExpressRequireAuth(), (req: Request, res: Response) => {
    res.json(req.auth);
  });

export default router;
