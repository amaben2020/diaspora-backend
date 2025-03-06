import { paramSchema, userSchema } from '../../models/index.ts';
import { createUser, getUser, getUsers, updateUser } from '../../core/user.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';

import { redisClient } from '../../utils/redis.ts';
import { logger } from '../../utils/logger.ts';

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
  const { id } = paramSchema.parse(req.params);

  // TODO: join with location
  const data = await getUser(id);

  // TODO: add a method isUserExist
  if (!data) {
    return next(new Error('User not found'));
  }

  res.status(200).json(data);
});

export const userGetsController = tryCatchFn(async (req, res, next) => {
  try {
    const { userId, radius, age } = req.query;

    const cacheKey = `all-users-with-locations-${userId}-${radius}-${age}`;
    const cachedUsers = await redisClient.get(cacheKey);

    if (cachedUsers) {
      logger.info('Cache hit');
      res.json({ cache: true, users: JSON.parse(cachedUsers) });
    }

    if (!userId)
      res.status(400).json({ status: 'fail', message: 'User ID is required' });

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

    if (parsedRadius[0] < 0 || parsedRadius[1] > 6378.14) {
      next(Error('Something went wrong'));
      res.status(409).json({
        status: 'unprocessable entity',
        message: 'Invalid distance range',
      });
    }

    if (parsedAge[0] < 18 || parsedAge[1] > 199) {
      res.status(409).json({
        status: 'Invalid',
        message: 'Invalid age range',
      });
    }

    if (parsedRadius?.some(isNaN) || parsedAge?.some(isNaN)) {
      res
        .status(400)
        .json({ status: 'fail', message: 'Invalid number format' });
    }

    const users = await getUsers(String(userId), parsedRadius, parsedAge);

    // Store in Redis with 30-minute expiry
    await redisClient.set(cacheKey, JSON.stringify(users), 1800);
    res.json({ cache: false, users });
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({ status: 'fail', message: error.message });
  }
});
