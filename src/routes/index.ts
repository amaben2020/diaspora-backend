import express from 'express';
import test from './hello.ts';
import interests from './interests.ts';
import user from './user.ts';
import preferenceRouter from './preference.ts';
import imagesRouter from './image.ts';

const router = express.Router();

// all resources and endpoints here
router.use('', test);
router.use('', interests);
router.use('', user);
router.use('', preferenceRouter);
router.use('', imagesRouter);

export default router;
