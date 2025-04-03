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
import profileViewsRouter from './profileViews.ts';
import paymentRouter from './payment.ts';
import favoritesRouter from './favorites.ts';
import profilesRouter from './profiles.ts';

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
router.use('', profileViewsRouter);
router.use('', paymentRouter);
router.use('', favoritesRouter);
router.use('', profilesRouter);

export default router;
