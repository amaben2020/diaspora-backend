import type { z } from 'zod';
import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';
import type { userSchema } from '../models/index.ts';
import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNotNull,
  not,
  notExists,
} from 'drizzle-orm';
import { userActivityTable } from '../schema/userActivityTable.ts';
import { imagesTable } from '../schema/imagesTable.ts';
import { likesTable } from '../schema/likesTable.ts';
import { locationsTable } from '../schema/locationTable.ts';
import {
  cacheResults,
  createQueryHash,
  getCachedCountry,
  getCachedDistance,
  getCachedResults,
  getCountryFromCoordinates,
  getTravelTimeFromAPI,
  setCachedCountry,
  setCachedDistance,
} from '../utils/index.ts';
import { dislikesTable } from '../schema/dislikeTable.ts';
import { paymentsTable } from '../schema/paymentsTable.ts';

export const createUser = async (clerkId: string, phone?: string) => {
  const [user = undefined] = await db
    .insert(usersTable)
    .values({
      id: clerkId,
      phone,
    })
    .returning();

  return user;
};

export const updateUser = async (
  data: z.infer<typeof userSchema>,
  id: string,
) => {
  const {
    birthday,
    gender,
    email,
    lastLogin,
    displayName,
    subscriptionType,
    phone,
    showGender,
  } = data;

  const [user = undefined] = await db
    .update(usersTable)
    .set({
      birthday,
      gender,
      email,
      lastLogin: lastLogin ? new Date(lastLogin) : null,
      displayName,
      subscriptionType,
      phone,
      showGender,
    })
    .where(eq(usersTable.id, id))
    .returning();

  return user;
};

export const getUser = async (id: string) => {
  const [user = undefined] = await db
    .select({
      displayName: usersTable.displayName,
      email: usersTable.email,
      id: usersTable.id,
      subscription: paymentsTable.subscriptionType,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .leftJoin(paymentsTable, eq(usersTable.id, paymentsTable.userId));

  return user;
};
export type TGender = 'man' | 'woman' | 'nonbinary';

export async function getUsers(
  currentUserId: string,
  radiusRange: number[],
  ageRange: number[],
  gender?: string,
  activity?: 'justJoined',
  country?: string,
) {
  // Create query fingerprint for caching
  const queryHash = createQueryHash({
    radiusRange,
    ageRange,
    gender,
    activity,
    country,
  });

  // Check for cached results first
  const cachedResults = await getCachedResults(currentUserId, queryHash);

  if (cachedResults) return cachedResults;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get current user's location
  const [currentLocation] = await db
    .select({
      latitude: locationsTable.latitude,
      longitude: locationsTable.longitude,
      countryAbbreviation: locationsTable.countryAbbreviation,
    })
    .from(locationsTable)
    .where(eq(locationsTable.userId, currentUserId))
    .limit(1);

  if (!currentLocation) throw new Error('Current user location not found');

  // First get all users matching the filters
  const users = await db
    .select({
      user: usersTable,
      birthday: usersTable.birthday,
      onlineStatus: userActivityTable.onlineStatus,
      latitude: locationsTable.latitude,
      longitude: locationsTable.longitude,
      countryAbbreviation: locationsTable.countryAbbreviation,
    })
    .from(usersTable)
    .leftJoin(locationsTable, eq(usersTable.id, locationsTable.userId))
    .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId))
    .where(
      and(
        gender ? eq(usersTable.gender, gender) : undefined,
        activity === 'justJoined'
          ? gte(usersTable.createdAt, twentyFourHoursAgo)
          : undefined,
        country ? eq(locationsTable.countryAbbreviation, country) : undefined,
        not(eq(usersTable.id, currentUserId)),
        notExists(
          db
            .select()
            .from(likesTable)
            .where(
              and(
                eq(likesTable.likerId, currentUserId),
                eq(likesTable.likedId, usersTable.id),
              ),
            ),
        ),
        notExists(
          db
            .select()
            .from(dislikesTable)
            .where(
              and(
                eq(dislikesTable.dislikerId, currentUserId),
                eq(dislikesTable.dislikedId, usersTable.id),
              ),
            ),
        ),
      ),
    );

  // Then get all images for these users in a single query
  const userIds = users.map((u) => u.user.id);
  const allImages =
    userIds.length > 0
      ? await db
          .select()
          .from(imagesTable)
          .where(
            and(
              inArray(imagesTable.userId, userIds),
              isNotNull(imagesTable.imageUrl),
            ),
          )
          .orderBy(asc(imagesTable.order))
      : [];

  // Group images by user ID
  const imagesByUser = allImages.reduce((acc, image) => {
    if (!acc[image.userId]) acc[image.userId] = [];
    acc[image.userId].push({
      imageUrl: image.imageUrl,
      order: image.order,
    });
    return acc;
  }, {});

  // Process users with caching
  const origin = {
    lat: parseFloat(currentLocation.latitude),
    lng: parseFloat(currentLocation.longitude),
  };

  // Get origin country (cached)
  let originCountry = await getCachedCountry(origin.lat, origin.lng);
  if (!originCountry) {
    originCountry = await getCountryFromCoordinates(origin.lat, origin.lng);
    await setCachedCountry(origin.lat, origin.lng, originCountry!);
  }

  const usersWithDistances = await Promise.all(
    users.map(async (user) => {
      if (!user.latitude || !user.longitude || !user.birthday) return null;

      const age =
        new Date().getFullYear() - new Date(user.birthday).getFullYear();
      if (age < ageRange[0] || age > ageRange[1]) return null;

      const destination = {
        lat: parseFloat(user.latitude),
        lng: parseFloat(user.longitude),
      };

      // Get destination country (cached)
      let country = await getCachedCountry(destination.lat, destination.lng);
      if (!country) {
        country = await getCountryFromCoordinates(
          destination.lat,
          destination.lng,
        );
        await setCachedCountry(destination.lat, destination.lng, country!);
      }

      // Check if same country
      const sameCountry = originCountry?.abrv === country?.abrv;
      let distanceKm: number | string = radiusRange[1];
      let travelTimeMinutes = 0;

      // For same country: get distance
      if (sameCountry) {
        const cachedDistance = await getCachedDistance(origin, destination);
        if (cachedDistance) {
          distanceKm = cachedDistance.distanceKm;
          travelTimeMinutes = cachedDistance.travelTimeMinutes;
        } else {
          try {
            const result = await getTravelTimeFromAPI(
              origin.lat,
              origin.lng,
              destination.lat,
              destination.lng,
            );
            distanceKm = result.distanceKm;
            travelTimeMinutes = result.travelTimeMinutes;
            await setCachedDistance(origin, destination, result);
          } catch (error) {
            console.error('Error fetching distance:', error);
          }
        }
      } else {
        distanceKm = `Currently in ${country?.name.includes('United') ? 'The ' : ''}${country?.name} ${country?.flag}`;
      }

      return {
        ...user.user,
        onlineStatus: user.onlineStatus,
        images: imagesByUser[user.user.id] || [],
        distanceKm,
        travelTimeMinutes,
        countryAbbreviation: user.countryAbbreviation,
        country,
      };
    }),
  );

  // Filter final results
  const filteredResults = usersWithDistances.filter(Boolean).filter((user) => {
    const distance =
      typeof user?.distanceKm === 'number' ? user.distanceKm : radiusRange[1];
    return distance >= radiusRange[0] && distance <= radiusRange[1];
  });

  // Cache final results
  await cacheResults(currentUserId, queryHash, filteredResults);

  return filteredResults;
}

export const isUserExists = async (userId: string): Promise<boolean> => {
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .execute();

  return existingUser as unknown as boolean;
};
