import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import dotenv from 'dotenv';
import { likeUserController } from '../controller/likes/like.ts';

dotenv.config();

const likesRouter = Router();

likesRouter.route('/likes').post(clerkMiddleware(), likeUserController);

export default likesRouter;
