import { eq, or } from 'drizzle-orm';
import { db } from '../db.ts';
import { matchesTable } from '../schema/matchesTable.ts';

export const getMatches = async (id: string) => {
  const matches = await db
    .select()
    .from(matchesTable)
    .where(or(eq(matchesTable.user1Id, id)));

  return matches;
};
