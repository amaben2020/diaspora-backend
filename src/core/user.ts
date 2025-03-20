import type { z } from 'zod';
import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';
import type { userSchema } from '../models/index.ts';
import { and, eq, gte, not, notExists } from 'drizzle-orm';
import { userActivityTable } from '../schema/userActivityTable.ts';
import { imagesTable } from '../schema/imagesTable.ts';
import { likesTable } from '../schema/likesTable.ts';
import { locationsTable } from '../schema/locationTable.ts';
import {
  getCountryFromCoordinates,
  getTravelTimeFromAPI,
} from '../utils/index.ts';
import { dislikesTable } from '../schema/dislikeTable.ts';

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
    })
    .from(usersTable)
    .where(eq(usersTable.id, id));

  return user;
};
export type TGender = 'man' | 'woman' | 'nonbinary';
export const getUsers = async (
  currentUserId: string,
  radiusRange: number[], // [minRadius, maxRadius]
  ageRange: number[], // [minAge, maxAge]
  gender: TGender | undefined,
  activity: 'justJoined' | undefined,
  country: string | undefined,
) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const users = await db
    .select({
      user: usersTable,
      birthday: usersTable.birthday,
      imageUrl: imagesTable.imageUrl,
      order: imagesTable.order,
      onlineStatus: userActivityTable.onlineStatus,
      latitude: locationsTable.latitude,
      longitude: locationsTable.longitude,
      countryAbbreviation: locationsTable.countryAbbreviation,
    })
    .from(usersTable)
    .leftJoin(locationsTable, eq(usersTable.id, locationsTable.userId))
    .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
    .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId))
    .where(
      and(
        gender ? eq(usersTable.gender, String(gender)) : undefined,
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
        ), // Exclude disliked users
      ),
    );

  // Fetch the current user's location
  const [currentUserLocation] = await db
    .select({
      latitude: locationsTable.latitude,
      longitude: locationsTable.longitude,
      countryAbbreviation: locationsTable.countryAbbreviation,
    })
    .from(locationsTable)
    .where(eq(locationsTable.userId, currentUserId))
    .limit(1);

  if (!currentUserLocation) {
    throw new Error('Current user location not found');
  }

  const {
    latitude: lat1,
    longitude: lng1,
    countryAbbreviation: abrv,
  } = currentUserLocation;
  console.log('ABRV', abrv);
  // Helper function to calculate age
  const calculateAge = (birthday: string | null) => {
    if (!birthday) return null;
    const birthYear = new Date(birthday).getFullYear();
    return new Date().getFullYear() - birthYear;
  };

  // Use a Map to group users by their id
  const userMap = new Map();

  for (const {
    user,
    onlineStatus,
    imageUrl,
    order,
    latitude,
    longitude,
    birthday,
    countryAbbreviation,
  } of users) {
    if (!latitude || !longitude || !birthday) continue; // Ensure required fields exist

    const age = calculateAge(birthday);
    if (age === null || age < ageRange[0] || age > ageRange[1]) continue; // Age filter

    if (!userMap.has(user.id)) {
      userMap.set(user.id, {
        ...user,
        onlineStatus,
        latitude,
        longitude,
        countryAbbreviation,
        age,
        images: [],
      });
    }

    console.log('ORIGIN USER', countryAbbreviation);

    if (imageUrl) {
      userMap.get(user.id).images.push({ imageUrl, order });
    }
  }

  // Fetch distances using Google Maps API
  const usersWithDistances = await Promise.all(
    Array.from(userMap.values()).map(async (user) => {
      console.log('CA', user);
      try {
        const { travelTimeMinutes, distanceKm } = await getTravelTimeFromAPI(
          parseFloat(lat1),
          parseFloat(lng1),
          parseFloat(user.latitude),
          parseFloat(user.longitude),
        );

        const [originCountry, country] = await Promise.all([
          await getCountryFromCoordinates(parseFloat(lat1), parseFloat(lng1)),
          await getCountryFromCoordinates(
            parseFloat(user.latitude),
            parseFloat(user.longitude),
          ),
        ]);

        const distanceAway =
          originCountry?.abrv == country?.abrv
            ? distanceKm
            : `Currently in ${country?.name.includes('United') ? 'The' : ''}${country?.name} ${country?.flag}`;

        return {
          ...user,
          distanceKm: distanceAway,
          travelTimeMinutes,
          country,
        };
      } catch (error) {
        console.error('Error fetching distance:', error);
        return null;
      }
    }),
  );

  // Filter users by travel distance
  return usersWithDistances.filter(Boolean).filter((user) => {
    let distanceKm = user.distanceKm;

    if (typeof distanceKm !== 'number') {
      // Assign maximum distance from the frontend range for overseas users
      distanceKm = radiusRange[1];
    }

    return distanceKm >= radiusRange[0] && distanceKm <= radiusRange[1];
  });
};

export const isUserExists = async (userId: string): Promise<boolean> => {
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .execute();

  return existingUser as unknown as boolean;
};
