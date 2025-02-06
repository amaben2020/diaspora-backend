import { eq } from 'drizzle-orm';
import { db } from '../db.ts';
import { preferencesTable } from '../schema/preferencesTable.ts';
import type { preferencesSchema } from '../models/index.ts';
import type { z } from 'zod';

export const createPreference = async (
  lookingToDate: string[],
  userId: string,
) => {
  const [preference = undefined] = await db
    .insert(preferencesTable)
    .values({
      lookingToDate,
      userId,
    })
    .returning();

  return preference;
};

export const updatePreference = async (
  data: z.infer<typeof preferencesSchema>,
  id: number,
) => {
  const {
    lookingToDate,
    interests,
    bio,
    drinking,
    education,
    pronouns,
    religion,
    smoking,
  } = data;

  const [user = undefined] = await db
    .update(preferencesTable)
    .set({
      lookingToDate,
      interests,
      bio,
      drinking,
      education,
      pronouns,
      religion,
      smoking,
    })
    .where(eq(preferencesTable.id, id))
    .returning();

  return user;
};
