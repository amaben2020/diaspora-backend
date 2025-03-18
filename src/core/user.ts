import type { z } from 'zod';
import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';
import type { userSchema } from '../models/index.ts';
import { and, eq, not, notExists } from 'drizzle-orm';
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

export const getUsers = async (
  currentUserId: string,
  radiusRange: number[], // [minRadius, maxRadius]
  ageRange: number[], // [minAge, maxAge]
) => {
  const users = await db
    .select({
      user: usersTable,
      birthday: usersTable.birthday,
      imageUrl: imagesTable.imageUrl,
      order: imagesTable.order,
      onlineStatus: userActivityTable.onlineStatus,
      latitude: locationsTable.latitude,
      longitude: locationsTable.longitude,
    })
    .from(usersTable)
    .leftJoin(locationsTable, eq(usersTable.id, locationsTable.userId))
    .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
    .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId))
    .where(
      and(
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
    })
    .from(locationsTable)
    .where(eq(locationsTable.userId, currentUserId))
    .limit(1);

  if (!currentUserLocation) {
    throw new Error('Current user location not found');
  }

  const { latitude: lat1, longitude: lng1 } = currentUserLocation;

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
        age,
        images: [],
      });
    }

    if (imageUrl) {
      userMap.get(user.id).images.push({ imageUrl, order });
    }
  }

  // Fetch distances using Google Maps API
  const usersWithDistances = await Promise.all(
    Array.from(userMap.values()).map(async (user) => {
      try {
        const { travelTimeMinutes, distanceKm } = await getTravelTimeFromAPI(
          parseFloat(lat1),
          parseFloat(lng1),
          parseFloat(user.latitude),
          parseFloat(user.longitude),
        );

        const country = await getCountryFromCoordinates(
          parseFloat(user.latitude),
          parseFloat(user.longitude),
        );

        return {
          ...user,
          distanceKm,
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
  return usersWithDistances
    .filter(Boolean)
    .filter(
      (user) =>
        user.distanceKm >= radiusRange[0] && user.distanceKm <= radiusRange[1],
    );
};

export const isUserExists = async (userId: string) => {
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .execute();

  return existingUser;
};
