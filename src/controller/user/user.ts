import { paramSchema, userSchema } from '../../models/index.ts';
import { createUser, getUser, getUsers, updateUser } from '../../core/user.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';

import { redisClient } from '../../utils/redis.ts';
import { logger } from '../../utils/logger.ts';
import { z } from 'zod';

export const userCreateController = tryCatchFn(async (req, res, next) => {
  const { clerkId, phone } = userSchema.parse(req.body);

  const data = await createUser(clerkId!, phone);

  if (!clerkId) res.status(400).send('Clerk id not found');

  if (!data) next(new Error('User not created'));

  res.status(201).json(data);
});

export const userUpdateController = tryCatchFn(async (req, res, next) => {
  const { id } = paramSchema.parse(req.params);
  const sanitizedBody = userSchema.parse(req.body);

  const data = await updateUser(sanitizedBody, id);

  if (!data) {
    return next(new Error('User not updated'));
  }

  res.status(200).json(data);
});

export const userGetController = tryCatchFn(async (req, res, next) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.params);

  // TODO: join with location
  const data = await getUser(userId);

  // TODO: add a method isUserExist
  if (!data) {
    return next(new Error('User not found'));
  }

  res.status(200).json(data);
});

const userGetSchema = z.object({
  userId: z.string(),
  radius: z.string(),
  age: z.string(),
  gender: z.enum(['man', 'woman', 'nonbinary']).optional(),
  activity: z.literal('justJoined').optional(),
  country: z.string().optional(),
});

export const userGetsController = tryCatchFn(async (req, res) => {
  try {
    const { userId, radius, age, gender, activity, country } =
      userGetSchema.parse(req.query);

    const cacheKey = `all-users-with-locations-${userId}-${radius}-${age}-${gender}-${activity}-${country}`;
    const cachedUsers = await redisClient.get(cacheKey);

    if (cachedUsers) {
      logger.info('Cache hit');
      return res.json({ cache: true, users: JSON.parse(cachedUsers) });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'User ID is required' });
    }

    // Parse radius and age into number arrays
    const parsedRadius = Array.isArray(radius)
      ? radius.map(Number)
      : radius
        ? JSON.parse(radius as string).map(Number)
        : undefined;

    const parsedAge = Array.isArray(age)
      ? age.map(Number)
      : age
        ? JSON.parse(age as string).map(Number)
        : undefined;

    const MAX_DISTANCE = 22226378.14;

    if (parsedRadius[0] < 0 || parsedRadius[1] > MAX_DISTANCE) {
      return res.status(409).json({
        status: 'unprocessable entity',
        message: 'Invalid distance range',
      });
    }

    if (parsedAge[0] < 18 || parsedAge[1] > 199) {
      return res.status(409).json({
        status: 'Invalid',
        message: 'Invalid age range',
      });
    }

    if (parsedRadius?.some(isNaN) || parsedAge?.some(isNaN)) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Invalid number format' });
    }

    const users = await getUsers(
      String(userId),
      parsedRadius,
      parsedAge,
      gender,
      activity,
      country?.toUpperCase(),
    );

    // Store in Redis with 2-minute expiry
    await redisClient.set(cacheKey, JSON.stringify(users), 120);
    return res.json({ cache: false, users });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ status: 'fail', message: error.message });
    }
  }
});
