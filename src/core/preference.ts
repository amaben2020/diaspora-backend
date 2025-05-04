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
    ethnicity,
    zodiac,
    pets,
    age,
    distance,
    language,
    familyPlans,
    gender,
    height,
    hasBio,
    minNumberOfPhotos,
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
      ethnicity,
      zodiac,
      pets,
      age,
      distance,
      language,
      familyPlans,
      gender,
      height,
      hasBio,
      minNumberOfPhotos,
      updatedAt: new Date(), // Explicitly update the timestamp
    })
    .where(or(eq(preferencesTable.id, id), eq(preferencesTable.userId, userId)))
    .returning();

  return updatedPreference;
};

export const getPreference = async (id: string) => {
  const [preference = undefined] = await db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.userId, id));

  return preference;
};
