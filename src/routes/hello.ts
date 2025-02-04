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

router.route('/').get((_: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'Running' });
});

export default router;

//import {
//   ClerkExpressRequireAuth,
//   ClerkExpressWithAuth,
// } from '@clerk/clerk-sdk-node';
// import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
// All routes have access to the auth based on token
// app.get('/api/protected', (req, res) => {
//   if (!req.auth.userId) {
//     console.log('req.auth.userId', req.auth.userId);
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   res.json({ message: 'Protected route', user: req.auth });
//   console.log(req.auth);
// });

// app.get('/protected', requireAuth(), (req, res) => {
//   res.send('Protected data');
//   console.log(req.auth);
//   logger.info(req.auth);
// });

// app.get('/user', requireAuth(), (req, res) => {
//   const user = req.auth;
//   console.log('user', user);
//   res.json({ user });
// });

// app.get('/', (req, res) => {
//   res.send('Running');
// });
