import type { z } from 'zod';
import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';
import type { userSchema } from '../models/index.ts';
import { and, eq, not, notExists } from 'drizzle-orm';
import { userActivityTable } from '../schema/userActivityTable.ts';
import { imagesTable } from '../schema/imagesTable.ts';
import { likesTable } from '../schema/likesTable.ts';

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
  const usersWithImages = await db
    .select({
      user: usersTable,
      imageUrl: imagesTable.imageUrl,
      order: imagesTable.order,
      onlineStatus: userActivityTable.onlineStatus,
    })
    .from(usersTable)
    .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
    .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId))
    .where(
      and(
        // Exclude the current user
        not(eq(usersTable.id, currentUserId)),
        // Exclude users the current user has liked
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
        // Exclude users the current user has disliked
        // notExists(
        //   db
        //     .select()
        //     .from(dislikesTable)
        //     .where(
        //       and(
        //         eq(dislikesTable.userId, currentUserId), // Ensure this matches your schema
        //         eq(dislikesTable.dislikedId, usersTable.id), // Ensure this matches your schema
        //       ),
        //     ),
        // ),
      ),
    );

  // Log the query for debugging
  console.log(
    'Generated SQL Query:',
    db
      .select({
        user: usersTable,
        imageUrl: imagesTable.imageUrl,
        order: imagesTable.order,
        onlineStatus: userActivityTable.onlineStatus,
      })
      .from(usersTable)
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
          // notExists(
          //   db
          //     .select()
          //     .from(dislikesTable)
          //     .where(
          //       and(
          //         eq(dislikesTable.userId, currentUserId),
          //         eq(dislikesTable.dislikedId, usersTable.id),
          //       ),
          //     ),
          // ),
        ),
      )
      .toSQL(),
  );

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
