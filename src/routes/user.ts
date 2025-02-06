import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';

import { userCreateController } from '../controller/user/user.ts';

const router = Router();
router.route('/user').post(clerkMiddleware(), userCreateController);

export default router;
