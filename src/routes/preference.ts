import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';

import {
  preferenceCreateController,
  // preferenceUpdateController,
} from '../controller/preference/preference.ts';

const preferenceRouter = Router();

preferenceRouter
  .route('/preference')
  .post(clerkMiddleware(), preferenceCreateController);

//   preferenceRouter
//     .route('/preference/:id')
//     .patch(clerkMiddleware(), preferenceUpdateController);

// ;

export default preferenceRouter;
