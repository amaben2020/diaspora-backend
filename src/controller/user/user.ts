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

export const userGetsController = tryCatchFn(async (req, res) => {
  const { userId, radius } = req.query;

  const cacheKey = `all-users-with-locations-${userId}-${radius}`;
  const cachedUsers = await redisClient.get(cacheKey);

  if (cachedUsers) {
    logger.info('Cache hit');
    res.json({ cache: true, users: JSON.parse(cachedUsers) });
  }

  logger.info('Cache miss. Fetching fresh data...');
  const users = await getUsers(String(userId), +radius!);

  if (!users) {
    logger.error('Users not found');
    res.status(404).json({ error: 'Users not found' });
  }

  // Store in Redis with 30-minute expiry
  await redisClient.set(cacheKey, JSON.stringify(users), 1800);
  res.json({ cache: false, users });
});
