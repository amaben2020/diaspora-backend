import { db } from '../db.ts';
import { preferencesTable } from '../schema/preferencesTable.ts';

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
