import { eq, or } from 'drizzle-orm';
import { db } from '../db.ts';
import { matchesTable } from '../schema/matchesTable.ts';
import { usersTable } from '../schema/usersTable.ts';
import { locationsTable } from '../schema/locationTable.ts';
import { imagesTable } from '../schema/imagesTable.ts';
import { userActivityTable } from '../schema/userActivityTable.ts';

// TODO: Extract to subquery and format data properly
export const getMatches = async (id: string) => {
  const matches = await db
    .select()
    .from(matchesTable)
    .where(or(eq(matchesTable.user1Id, id), eq(matchesTable.user2Id, id)))
    .leftJoin(
      usersTable,
      or(
        eq(matchesTable.user1Id, usersTable.id),
        eq(matchesTable.user2Id, usersTable.id),
      ),
    )
    .leftJoin(locationsTable, eq(usersTable.id, locationsTable.userId))
    .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
    .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId));

  return matches;
};
