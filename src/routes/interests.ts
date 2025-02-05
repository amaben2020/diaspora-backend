import express, { type Response } from 'express';

import { logger } from '../utils/logger.ts';
import { INTERESTS } from '../constants/index.ts';
// import { redisClient } from '../utils/redis.ts';

const router = express.Router();

router.route('/interests').get((_, res: Response) => {
  try {
    if (!INTERESTS) {
      logger.error('Interests not found');
    }
    res.json({ interests: INTERESTS });
  } catch (error) {
    console.log(error);
  }
});

// router.route('/interests').get(async (_, res: Response) => {
//   try {
//     // Check cache first
//     const cachedData = await redisClient.get('interests');
//     if (cachedData) {
//       return res.json({ interests: JSON.parse(cachedData) });
//     }

//     if (!INTERESTS) {
//       logger.error('Interests not found');
//       return res.status(404).json({ error: 'Interests not found' });
//     }

//     // Store in Redis (expire in 1 hour)
//     await redisClient.set('interests', JSON.stringify(INTERESTS), 3600);

//     res.json({ interests: INTERESTS });
//   } catch (error) {
//     console.error('Error fetching interests:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

export default router;
