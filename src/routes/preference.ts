import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';

import {
  preferenceCreateController,
  preferenceGetController,
  preferenceUpdateController,
} from '../controller/preference/preference.ts';

const preferenceRouter = Router();

preferenceRouter
  .route('/preference')
  .post(clerkMiddleware(), preferenceCreateController);

preferenceRouter
  .route('/preference/:id/:userId')
  .patch(clerkMiddleware(), preferenceUpdateController);

preferenceRouter
  .route('/preference/:id')
  .get(clerkMiddleware(), preferenceGetController);

export default preferenceRouter;
