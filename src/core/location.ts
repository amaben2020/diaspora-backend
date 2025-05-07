import { db } from '../db.ts';
import { locationsTable } from '../schema/locationTable.ts';
import { getCountryFromCoordinates } from '../utils/index.ts';

export const createLocation = async ({
  userId,
  latitude,
  longitude,
}: {
  userId: string;
  latitude: string;
  longitude: string;
}) => {
  const country = await getCountryFromCoordinates(
    parseFloat(latitude),
    parseFloat(longitude),
  );

  if (country?.abrv) {
    const location = await db
      .insert(locationsTable)
      .values({
        userId,
        latitude,
        longitude,
        countryAbbreviation: country?.abrv,
      })
      .returning();

    return location;
  }

  //TODO:  remove this later when google api is back, simply return null
  const mockLocation = await db
    .insert(locationsTable)
    .values({
      userId,
      latitude: '9.044679',
      longitude: '7.51913154046585',
      countryAbbreviation: 'NG',
    })
    .returning();

  return mockLocation;
  // return null
};

export const updateLocation = async ({
  userId,
  latitude,
  longitude,
  countryAbbreviation,
}: {
  userId: string;
  latitude: string;
  longitude: string;
  countryAbbreviation?: string;
}) => {
  const location = await db
    .update(locationsTable)
    .set({
      userId,
      latitude,
      longitude,
      countryAbbreviation,
    })
    .returning();

  return location;
};
