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

// export const updatePreference = async (
//   data: z.infer<typeof preferencesSchema>,
//   id: number,
//   userId: string,
// ) => {
//   const {
//     lookingToDate,
//     interests,
//     bio = '',
//     drinking,
//     education = '',
//     pronouns = '',
//     religion = '',
//     smoking,
//     ethnicity = '',
//     zodiac = '',
//     pets = '',
//     age = '',
//     distance = '',
//     language = '',
//     familyPlans = '',
//     gender = '',
//     height = '',
//     hasBio,
//     minNumberOfPhotos = '',
//   } = data;

//   const [updatedPreference = undefined] = await db
//     .update(preferencesTable)
//     .set({
//       lookingToDate,
//       interests,
//       bio,
//       drinking,
//       education,
//       pronouns,
//       religion,
//       smoking,
//       ethnicity,
//       zodiac,
//       pets,
//       age,
//       distance,
//       language,
//       familyPlans,
//       gender,
//       height,
//       hasBio,
//       minNumberOfPhotos,
//       updatedAt: new Date(),
//     })
//     .where(or(eq(preferencesTable.id, id), eq(preferencesTable.userId, userId)))
//     .returning();

//   return updatedPreference;
// };

export const updatePreference = async (
  data: Partial<z.infer<typeof preferencesSchema>>,
  id: number,
  userId: string,
) => {
  // 1. First get the existing preferences from DB
  const [existingPreference = undefined] = await db
    .select()
    .from(preferencesTable)
    .where(or(eq(preferencesTable.id, id), eq(preferencesTable.userId, userId)))
    .limit(1);

  // if (!existingPreference) {
  //   throw new Error('Preference not found');
  // }

  // 2. Create merged data - existing values + new values
  const mergedData = {
    ...existingPreference,
    ...data, // This overwrites only the provided fields
    updatedAt: new Date(), // Always update timestamp
    createdAt: existingPreference?.createdAt,
  };

  // 3. Update with the merged data
  const [updatedPreference = undefined] = await db
    .update(preferencesTable)
    .set(mergedData)
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
