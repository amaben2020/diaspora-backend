import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  updateFcmTokenController,
  userCreateController,
  userGetController,
  userGetsController,
  userUpdateController,
} from '../controller/user/user.ts';
import { checkBlocked } from '../middleware/block.ts';

const getUsersLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, slow down!' },
});

//TODO: Improve middleware handling and redundancy
const router = Router();
router.route('/user').post(clerkMiddleware(), userCreateController);
router.route('/user/:id').patch(clerkMiddleware(), userUpdateController);
router.route('/user/:userId').get(clerkMiddleware(), userGetController);
router
  .route('/users')
  .get(clerkMiddleware(), checkBlocked, getUsersLimiter, userGetsController);
router.route('/fcm-token').put(updateFcmTokenController);

export default router;
