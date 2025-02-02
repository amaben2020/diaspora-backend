import express from 'express';
import test from './hello.ts';

const router = express.Router();

// all resources and endpoints here
router.use('', test);

export default router;
