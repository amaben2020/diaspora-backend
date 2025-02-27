import type { z } from 'zod';
import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';
import type { userSchema } from '../models/index.ts';
import { eq } from 'drizzle-orm';
import { userActivityTable } from '../schema/userActivityTable.ts';
import { imagesTable } from '../schema/imagesTable.ts';

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

export const getUsers = async () => {
  const usersWithImages = await db
    .select({
      user: usersTable,
      imageUrl: imagesTable.imageUrl,
      order: imagesTable.order,
      onlineStatus: userActivityTable.onlineStatus,
    })
    .from(usersTable)
    .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
    .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId));

  // Efficiently group images into an array per user
  const userMap = new Map();

  usersWithImages.forEach(({ user, onlineStatus, imageUrl, order }) => {
    if (!userMap.has(user.id)) {
      userMap.set(user.id, {
        ...user,
        onlineStatus,
        images: [],
      });
    }

    if (imageUrl) {
      userMap.get(user.id).images.push({ imageUrl, order });
    }
  });

  return Array.from(userMap.values());
};
