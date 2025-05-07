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
import { db } from '../../db.ts';
import { preferencesTable } from '../../schema/preferencesTable.ts';
import { inArray, or } from 'drizzle-orm';

import { clerkClient } from '@clerk/express';

import { eq } from 'drizzle-orm';
import { premiumFeaturesTable } from '../../schema/premiumFeatureTable.ts';
import { usersTable } from '../../schema/usersTable.ts';
import {
  rouletteSessionsTable,
  rouletteMatchesTable,
} from '../../schema/rouletteTable.ts';

const deleteUserSchema = z.object({
  id: z.string().min(1, 'User ID is required for this operation'),
});

export const deleteUserController = tryCatchFn(async (req, res) => {
  const { id } = deleteUserSchema.parse(req.params);

  try {
    // Get all session IDs first
    const sessionIds = await db
      .select({ id: rouletteSessionsTable.id })
      .from(rouletteSessionsTable)
      .where(eq(rouletteSessionsTable.userId, id))
      .then((res) => res.map((r) => r.id));

    // Execute all deletions in sequence
    if (sessionIds.length > 0) {
      await db
        .delete(rouletteMatchesTable)
        .where(
          or(
            inArray(rouletteMatchesTable.session1Id, sessionIds),
            inArray(rouletteMatchesTable.session2Id, sessionIds),
          ),
        );
    }

    await db
      .delete(rouletteSessionsTable)
      .where(eq(rouletteSessionsTable.userId, id));

    await db
      .delete(premiumFeaturesTable)
      .where(eq(premiumFeaturesTable.userId, id));

    const deletedUser = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();

    if (!deletedUser.length) {
      throw new Error('User not found in database');
    }

    const clerkResponse = await clerkClient.users.deleteUser(id);

    if (!clerkResponse.deleted)
      throw new Error('Failed to delete user from Clerk');

    res.status(204).send('Delete Success');
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
});

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
  zodiac: z.string().optional(),
  height: z.string().optional(),
  ethnicity: z.string().optional(),
  educationLevel: z.string().optional(),
  lookingFor: z.any().optional(),
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

    //TODO: Improve this logic and efficiency
    // Get fresh preferences for all users in one query
    const userIds = users.map((u) => u.id);
    const freshPreferences =
      userIds.length > 0
        ? await db
            .select()
            .from(preferencesTable)
            .where(inArray(preferencesTable.userId, userIds))
        : [];

    // Create a map of fresh preferences
    const preferencesMap = new Map(freshPreferences.map((p) => [p.userId, p]));

    // Merge fresh preferences into users
    users = users.map((user) => ({
      ...user,
      preferences: preferencesMap.get(user.id) || user.preferences,
    }));

    // Apply advanced filters
    if (smoking === 'true') {
      users = users.filter((u) => u.preferences?.smoking === true);
    }

    if (drinking === 'true') {
      users = users.filter((u) => {
        return u.preferences?.drinking === true;
      });
    }

    if (ethnicity) {
      users = users.filter((u) => {
        console.log(
          'decodeURI(ethnicity) ===>',
          decodeURI(ethnicity),
          u.preferences?.ethnicity,
        );
        return u.preferences?.ethnicity === ethnicity;
      });
    }

    if (educationLevel) {
      users = users.filter((u) =>
        u.preferences?.education.includes(educationLevel),
      );
    }

    if (lookingFor) {
      users = users.filter((u) => {
        return u.preferences?.lookingToDate?.includes(decodeURI(lookingFor));
      });
    }

    if (height) {
      users = users.filter(
        (u) =>
          u.preferences?.height?.split(' ').pop() ===
          decodeURI(height)?.split('-')[1],
      );
    }

    if (hasBio === 'true') {
      users = users.filter(
        (u) => u.preferences.hasBio || u.profile?.bio.length > 20,
      );
    }

    if (minPhotos?.length) {
      users = users.filter((u) => u.images.length >= Number(minPhotos));
    }

    if (familyPlans) {
      const decodedFamilyPlans = decodeURIComponent(familyPlans);

      const validFamilyPlans = [
        'Want children',
        "Don't want children",
        'Have children',
        'Open to children',
        'Not sure yet',
      ];

      if (validFamilyPlans.includes(decodedFamilyPlans)) {
        users = users.filter((u) => {
          return u.preferences?.familyPlans == decodedFamilyPlans;
        });
      }
    }

    // console.log('zodiac ===>', zodiac);
    if (zodiac) {
      const decodedZodiac = decodeURIComponent(zodiac);
      // console.log('decodedZodiac ===>', decodedZodiac);
      const validZodiac = [
        'Aries',
        'Taurus',
        'Gemini',
        'Cancer',
        'Leo',
        'Virgo',
        'Libra',
        'Scorpio',
        'Sagittarius',
        'Capricorn',
        'Aquarius',
        'Pisces',
        "I don't believe in zodiac signs",
      ];

      if (validZodiac.includes(decodedZodiac)) {
        users = users.filter((u) => {
          // console.log(u.preferences);
          return u.preferences?.zodiac == decodedZodiac;
        });
      }
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
