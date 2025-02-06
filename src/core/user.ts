import type { z } from 'zod';
import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';
import type { userSchema } from '../models/index.ts';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';

export const createUser = async (clerkId: string) => {
  const [user = undefined] = await db
    .insert(usersTable)
    .values({
      id: clerkId,
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
    onlineStatus,
    gender,
    email,
    lastLogin,
    displayName,
    subscriptionType,
  } = data;

  const bday = DateTime.fromFormat(String(birthday), 'dd-MM-yyyy').toJSDate();

  console.log('bday', bday);

  const [user = undefined] = await db
    .update(usersTable)
    .set({
      birthday,
      onlineStatus,
      gender,
      email,
      lastLogin: lastLogin ? new Date(lastLogin) : null,
      displayName,
      subscriptionType,
    })
    .where(eq(usersTable.id, id))
    .returning();

  return user;
};
