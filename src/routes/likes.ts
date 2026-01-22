import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import dotenv from 'dotenv';
import {
  getLikedUsersController,
  likeUserController,
  getReceivedLikesController,
} from '../controller/likes/like.ts';

dotenv.config();

const likesRouter = Router();

likesRouter.route('/likes').post(clerkMiddleware(), likeUserController);
likesRouter
  .route('/likes/:userId')
  .get(clerkMiddleware(), getLikedUsersController);

likesRouter
  .route('/likes/received/:userId')
  .get(clerkMiddleware(), getReceivedLikesController);

export default likesRouter;
