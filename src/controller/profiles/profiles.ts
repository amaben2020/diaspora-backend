import { eq, sql } from 'drizzle-orm';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { db } from '../../db.ts';
import { profilesTable } from '../../schema/profileTable.ts';
import { usersTable } from '../../schema/usersTable.ts';
import { preferencesTable } from '../../schema/preferencesTable.ts';
import { imagesTable } from '../../schema/imagesTable.ts';

export const createProfileController = tryCatchFn(async (req, res) => {
  const { userId, bio, interests } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // TODO: Move all db calls to core and implement zod schema
  const [profile] = await db
    .insert(profilesTable)
    .values({
      userId,
      bio,
      interests,
    })
    .returning();

  return res.status(201).json(profile);
});

export const getProfileController = tryCatchFn(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const [profile] = await db
    .select({
      id: profilesTable.id,
      userId: profilesTable.userId,
      bio: profilesTable.bio,
      interests: profilesTable.interests,
      createdAt: profilesTable.createdAt,
      updatedAt: profilesTable.updatedAt,
      user: {
        id: usersTable.id,
        name: usersTable.displayName,
        email: usersTable.email,
        age: usersTable.birthday,
      },
      preferences: {
        id: preferencesTable.id,
        lookingFor: preferencesTable.lookingToDate,
        zodiac: preferencesTable.zodiac,
      },
      images: sql`JSON_ARRAYAGG(${imagesTable.imageUrl})`.as('images'),
    })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .leftJoin(usersTable, eq(profilesTable.userId, usersTable.id))
    .leftJoin(
      preferencesTable,
      eq(profilesTable.userId, preferencesTable.userId),
    )
    .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
    .groupBy(profilesTable.id, usersTable.id, preferencesTable.id);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  return res.status(200).json(profile);
});

export const updateProfileController = tryCatchFn(async (req, res) => {
  const { userId } = req.params;
  const { bio, interests } = req.body;

  if (!userId) res.status(400).json({ error: 'Missing userId' });

  const [profile] = await db
    .update(profilesTable)
    .set({
      bio,
      interests,
      updatedAt: new Date(),
    })
    .where(eq(profilesTable.userId, userId))
    .returning();

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  return res.status(200).json(profile);
});

export const deleteProfileController = tryCatchFn(async (req, res) => {
  const { userId } = req.params;

  if (!userId) res.status(400).json({ error: 'Missing userId' });

  const [profile] = await db
    .delete(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .returning();

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  return res.status(200).json({ success: true });
});
