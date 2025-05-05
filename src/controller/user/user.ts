import { paramSchema, userSchema } from '../../models/index.ts';
import {
  createUser,
  getUser,
  getUsers,
  updateUser,
  userUpdateFcmToken,
} from '../../core/user.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { redisClient } from '../../utils/redis.ts';
import { logger } from '../../utils/logger.ts';
import { z } from 'zod';
import { createProfile } from '../../core/profile.ts';

export const userCreateController = tryCatchFn(async (req, res, next) => {
  const { clerkId, phone } = userSchema.parse(req.body);

  const data = await createUser(clerkId!, phone);

  // create profile with default text, we could use a transaction so it fails
  await createProfile({
    userId: data?.id as string,
    bio: 'Enter your bio',
    interests: [''],
  });

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
  smoking: z.string().optional(),
  hasBio: z.string().optional(),
  drinking: z.string().optional(),
  minPhotos: z.string().optional(),
  familyPlans: z.string().optional(),
});

export const userGetsController = tryCatchFn(async (req, res) => {
  // TODO: Filter user by preferences ?gender=m&ethnicity=black&.....
  try {
    const {
      userId,
      radius,
      age,
      gender,
      activity,
      country,

      // Advanced filters
      ethnicity,
      zodiac,
      height,
      drinking,
      smoking,
      educationLevel,
      familyPlans,
      lookingFor,
      minPhotos,
      hasBio,
    } = userGetSchema.parse(req.query);

    const cacheKey = `all-users-with-locations-${userId}-${radius}-${age}-${gender}-${activity}-${country}-${smoking}-${ethnicity}-${zodiac}-${height}-${drinking}-${educationLevel}-${familyPlans}-${lookingFor}-${minPhotos}-${hasBio}`;
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

    let users = await getUsers(
      String(userId),
      parsedRadius,
      parsedAge,
      gender,
      activity,
      country?.toUpperCase(),
    );

    // Apply advanced filters
    if (smoking === 'true') {
      users = users.filter((u) => u.preferences?.smoking === true);
    }
    console.log('DRINKING', drinking);
    if (drinking === 'true') {
      users = users.filter((u) => {
        return u.preferences?.drinking === true;
      });
    }
    // if (ethnicity?.length > 0) {
    //   users = users.filter((u) =>
    //     u.preferences?.ethnicity.includes(decodeURI(ethnicity)),
    //   );
    // }
    // if (zodiac?.length > 0) {
    //   users = users.filter((u) =>
    //     u.preferences?.zodiac.includes(decodeURI(zodiac)),
    //   );
    // }
    // if (educationLevel?.length !== 'Open to any') {
    //   users = users.filter((u) =>
    //     u.preferences?.education.includes(decodeURI(educationLevel)),
    //   );
    // }

    console.log('FAMILY PLANS', encodeURI('Open to children'!));
    if (
      ([
        'Want children',
        "Don't want children",
        'Have children',
        'Open to children',
        'Not sure yet',
      ].includes(decodeURI(familyPlans!)) &&
        decodeURI(familyPlans!) !== 'Open to any') ||
      decodeURI(familyPlans!) !== 'null'
    ) {
      users = users.filter((u) => {
        console.log('u.preferences?.familyPlans ===>', u.preferences);

        return u.preferences?.familyPlans == decodeURI(familyPlans!);
      });
    }
    // if (lookingFor) {
    //   users = users.filter((u) =>
    //     u.preferences?.lookingFor.includes(decodeURI(lookingFor)),
    //   );
    // }
    // if (height) {
    //   users = users.filter((u) =>
    //     u.preferences?.height.includes(decodeURI(height)),
    //   );
    // }

    if (hasBio === 'true') {
      users = users.filter((u) => {
        console.log(u?.preferences);
        return u.preferences.hasBio || u.profile?.bio.length > 20;
      });
    }

    if (minPhotos) {
      users = users.filter((u) => u.images.length >= Number(minPhotos));
    }

    // Filter out blocked users if middleware ran
    if (Array.isArray(req?.blockedUserIds)) {
      users = users.filter((user) => !req.blockedUserIds.includes(user.id));
      await redisClient.set(cacheKey, JSON.stringify(users), 120);
    }

    // Store in Redis with 2-minute expiry
    await redisClient.set(cacheKey, JSON.stringify(users), 120);
    return res.json({ cache: false, users });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ status: 'fail', message: error.message });
    }
  }
});

export const updateFcmTokenController = tryCatchFn(async (req, res) => {
  const { fcmToken, userId } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ error: 'FCM token is required' });
  }
  await userUpdateFcmToken(fcmToken, userId);
  return res.status(200).json({ message: 'Token updated successfully' });
});
