import express, { type Response } from 'express';

import { logger } from '../utils/logger.ts';
import { INTERESTS } from '../constants/index.ts';

const router = express.Router();

router.route('/interests').get((_, res: Response) => {
  if (!INTERESTS) {
    logger.error('Interests not found');
  }
  res.json({ interests: INTERESTS });
  logger.log({ level: '4', message: 'Success' });
});

export default router;
