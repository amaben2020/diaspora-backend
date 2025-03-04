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
  // TODO: add a method isUserExist and cache with redis

  const currentUser = req.params.id;

  // const currentUser = 'user_2sqXP056VpAlQlvRzgU44E3A8mj';
  const users = await getUsers(currentUser);

  // Check cache first
  const cachedUsers = await redisClient.get('all-users-with-location');

  if (!cachedUsers) {
    logger.info('Cache: false');
    res.json({ cache: false, users });
  }

  if (cachedUsers) {
    logger.info('Cache: true');
    res.json({ cache: true, users: JSON.parse(cachedUsers) });
  }

  if (!users) {
    logger.error('Users not found');
    res.status(404).json({ error: 'Users not found' });
    next(new Error('User not found'));
  }

  // Store in Redis (expire in 30mins due to stale data)
  await redisClient.set(
    'all-users-with-location',
    JSON.stringify(users),
    3600 / 2,
  );
});
