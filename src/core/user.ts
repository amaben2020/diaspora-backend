import type { z } from 'zod';
import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';
import type { userSchema } from '../models/index.ts';
import { and, eq, not, notExists } from 'drizzle-orm';
import { userActivityTable } from '../schema/userActivityTable.ts';
import { imagesTable } from '../schema/imagesTable.ts';
import { likesTable } from '../schema/likesTable.ts';
import { locationsTable } from '../schema/locationTable.ts';
import { getTravelTimeFromAPI } from '../utils/index.ts';

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

export const getUsers = async (currentUserId: string) => {
  const users = await db
    .select({
      user: usersTable,
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
          //TODO: Extract to subquery
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
      ),
    );

  // Fetch the current user's location
  const [currentUserLocation = undefined] = await db
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

  // Process users with async distance calculation
  const usersWithDistances = await Promise.all(
    users.map(
      async ({ user, onlineStatus, imageUrl, order, latitude, longitude }) => {
        if (!latitude || !longitude) return null;

        const { travelTimeMinutes, distanceKm } = await getTravelTimeFromAPI(
          parseFloat(lat1),
          parseFloat(lng1),
          parseFloat(latitude),
          parseFloat(longitude),
        );

        return {
          ...user,
          onlineStatus,
          distanceKm,
          travelTimeMinutes,
          images: imageUrl ? [{ imageUrl, order }] : [],
        };
      },
    ),
  );

  return usersWithDistances.filter(Boolean);
};
