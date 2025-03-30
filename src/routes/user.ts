import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  userCreateController,
  userGetController,
  userGetsController,
  userUpdateController,
} from '../controller/user/user.ts';

const getUsersLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, slow down!' },
});

const router = Router();
router.route('/user').post(clerkMiddleware(), userCreateController);
router.route('/user/:id').patch(clerkMiddleware(), userUpdateController);
router.route('/user/:userId').get(clerkMiddleware(), userGetController);
router
  .route('/users')
  .get(clerkMiddleware(), getUsersLimiter, userGetsController);

export default router;
