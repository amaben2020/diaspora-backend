import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import dotenv from 'dotenv';
import {
  getLikedUsersController,
  likeUserController,
} from '../controller/likes/like.ts';

dotenv.config();

const likesRouter = Router();

likesRouter.route('/likes').post(clerkMiddleware(), likeUserController);
likesRouter
  .route('/likes/:userId')
  .get(clerkMiddleware(), getLikedUsersController);

export default likesRouter;
