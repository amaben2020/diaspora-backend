import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';

import {
  clearOldProfileViewsController,
  getProfileViewsController,
  recordProfileViewController,
} from '../controller/profileViews/profileViews.ts';

const router = Router();

router
  .route('/profile-views')
  .post(clerkMiddleware(), recordProfileViewController);

router
  .route('/profile-views/:userId')
  .get(clerkMiddleware(), getProfileViewsController);

router
  .route('/profile-views')
  .delete(clerkMiddleware(), clearOldProfileViewsController);

export default router;
