import { eq, or } from 'drizzle-orm';
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
  userId: string,
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

  const [updatedPreference = undefined] = await db
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
    .where(or(eq(preferencesTable.id, id), eq(preferencesTable.userId, userId)))
    .returning();

  return updatedPreference;
};
