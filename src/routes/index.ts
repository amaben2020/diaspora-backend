import express from 'express';
import test from './hello.ts';
import interests from './interests.ts';

const router = express.Router();

// all resources and endpoints here
router.use('', test);
router.use('', interests);

export default router;
