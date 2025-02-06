import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';

export const createUser = async (clerkId: string) => {
  const [user = undefined] = await db
    .insert(usersTable)
    .values({
      id: clerkId,
    })
    .returning();

  return user;
};
