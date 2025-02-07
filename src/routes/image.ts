import { clerkMiddleware } from '@clerk/express';
import { Router } from 'express';

import dotenv from 'dotenv';
import {
  createImageUrlController,
  getImageUploadUrlController,
} from '../controller/image/image.ts';

dotenv.config();

const imagesRouter = Router();

imagesRouter
  .route('/image/upload-url')
  .get(clerkMiddleware(), getImageUploadUrlController);

imagesRouter.route('/images').post(clerkMiddleware(), createImageUrlController);

export default imagesRouter;
