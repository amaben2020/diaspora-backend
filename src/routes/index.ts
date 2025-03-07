import express from 'express';
import test from './hello.ts';
import interests from './interests.ts';
import user from './user.ts';
import preferenceRouter from './preference.ts';
import imagesRouter from './image.ts';
import locationRouter from './location.ts';
import likesRouter from './likes.ts';
import dislikesRouter from './dislikes.ts';
import matchesRouter from './matches.ts';

const router = express.Router();

// all resources and endpoints here
router.use('', test);
router.use('', interests);
router.use('', user);
router.use('', preferenceRouter);
router.use('', imagesRouter);
router.use('', locationRouter);
router.use('', likesRouter);
router.use('', dislikesRouter);
router.use('', matchesRouter);

export default router;
