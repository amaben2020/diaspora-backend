import { db } from '../db.ts';
import { locationsTable } from '../schema/locationTable.ts';

export const createLocation = async ({
  userId,
  latitude,
  longitude,
}: {
  userId: string;
  latitude: string;
  longitude: string;
}) => {
  const location = await db
    .insert(locationsTable)
    .values({
      userId,
      latitude,
      longitude,
    })
    .returning();

  return location;
};
