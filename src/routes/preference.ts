import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';

import { preferenceCreateController } from '../controller/preference/preference.ts';

const preferenceRouter = Router();

preferenceRouter
  .route('/preference')
  .post(clerkMiddleware(), preferenceCreateController);

export default preferenceRouter;
