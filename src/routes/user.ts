import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';

import {
  userCreateController,
  userUpdateController,
} from '../controller/user/user.ts';

const router = Router();
router.route('/user').post(clerkMiddleware(), userCreateController);
router.route('/user/:id').patch(clerkMiddleware(), userUpdateController);

export default router;
