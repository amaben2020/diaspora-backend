import { db } from '../db.ts';
import { profilesTable } from '../schema/profileTable.ts';

export const createProfile = async ({
  userId,
  bio,
  interests,
}: {
  userId: string;
  bio: string;
  interests: string[];
}) => {
  const [profile] = await db
    .insert(profilesTable)
    .values({
      userId,
      bio,
      interests,
    })
    .onConflictDoUpdate({
      target: profilesTable.userId,
      set: {
        bio: profilesTable.bio,
        interests: profilesTable.interests,
        updatedAt: new Date(),
      },
    })
    .returning();

  return profile;
};
