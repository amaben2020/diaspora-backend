import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import { locationCreateController } from '../controller/location/location.ts';

const locationRouter = Router();
locationRouter
  .route('/location')
  .post(clerkMiddleware(), locationCreateController);

export default locationRouter;
