import express, { type Response } from 'express';
import { logger } from '@/utils/logger';
import { INTERESTS } from '@/constants';

const router = express.Router();

router.route('/interests').get((_, res: Response) => {
  if (!INTERESTS) {
    logger.error('Interests not found');
  }
  res.json({ interests: INTERESTS });
  logger.log({ level: '4', message: 'Success' });
});
