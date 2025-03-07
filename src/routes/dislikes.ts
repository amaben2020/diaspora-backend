import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import dotenv from 'dotenv';
import { dislikeUserController } from '../controller/dislike/dislike.ts';

dotenv.config();

const dislikesRouter = Router();

dislikesRouter
  .route('/dislikes')
  .post(clerkMiddleware(), dislikeUserController);

export default dislikesRouter;
