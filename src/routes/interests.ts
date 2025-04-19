import express from 'express';

import { logger } from '../utils/logger.ts';
import { INTERESTS } from '../constants/index.ts';
import { redisClient } from '../utils/redis.ts';
import { tryCatchFn } from '../utils/tryCatch.ts';

const router = express.Router();

router.route('/interests').get(
  tryCatchFn(async (req, res, next) => {
    // Check cache first
    const cachedData = await redisClient.get('interests');
    if (cachedData) {
      return res.json({ cache: true, interests: JSON.parse(cachedData) });
    }

    if (!INTERESTS) {
      logger.error('Interests not found');
      res.status(404).json({ error: 'Interests not found' });
      next(new Error('Something went wrong'));
    }

    // Store in Redis (expire in 1 hour)
    await redisClient.set('interests', JSON.stringify(INTERESTS), 3600);

    return res.json({ interests: INTERESTS });
  }),
);

export default router;
