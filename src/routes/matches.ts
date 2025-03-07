import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';
import dotenv from 'dotenv';
import { matchesGetController } from '../controller/matches/matches.ts';

dotenv.config();

const matchesRouter = Router();

matchesRouter
  .route('/matches/:userId')
  .get(clerkMiddleware(), matchesGetController);

export default matchesRouter;
