import { db } from '../db.ts';
import { usersTable } from '../schema/usersTable.ts';

export const createUser = async (clerkId: string) => {
  console.log('called');
  const [user = undefined] = await db
    .insert(usersTable)
    .values({
      id: clerkId,
      // clerkId,
    })
    .returning();
  console.log(user);
  return user;
};
