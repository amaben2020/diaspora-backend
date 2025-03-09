// import { eq, or } from 'drizzle-orm';
// import { db } from '../db.ts';
// import { matchesTable } from '../schema/matchesTable.ts';
// import { usersTable } from '../schema/usersTable.ts';
// import { locationsTable } from '../schema/locationTable.ts';
// import { imagesTable } from '../schema/imagesTable.ts';
// import { userActivityTable } from '../schema/userActivityTable.ts';

// // TODO: Extract to subquery and format data properly or use the user2Id to get the match
// // export const getMatches = async (id: string) => {
// //   const matches = await db
// //     .select()
// //     .from(matchesTable)
// //     .where(or(eq(matchesTable.user1Id, id), eq(matchesTable.user2Id, id)))
// //     .leftJoin(
// //       usersTable,
// //       or(
// //         eq(matchesTable.user1Id, usersTable.id),
// //         eq(matchesTable.user2Id, usersTable.id),
// //       ),
// //     )
// //     .leftJoin(locationsTable, eq(usersTable.id, locationsTable.userId))
// //     .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
// //     .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId));

// //   return matches;
// // };

// export const getMatches = async (id: string) => {
//   // Step 1: Get all matches for the user
//   const matches = await db
//     .select()
//     .from(matchesTable)
//     .where(or(eq(matchesTable.user1Id, id), eq(matchesTable.user2Id, id)));

//   // Step 2: Extract unique user IDs from matches
//   const matchedUserIds = matches.map((match) =>
//     match.user1Id === id ? match.user2Id : match.user1Id,
//   );

//   // Step 3: Fetch user details, location, and one image per user
//   const uniqueUsers = await db
//     .select({
//       user: usersTable,
//       location: locationsTable,
//       image: imagesTable,
//       activity: userActivityTable,
//     })
//     .from(usersTable)
//     .leftJoin(locationsTable, eq(usersTable.id, locationsTable.userId))
//     .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
//     .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId))
//     .where(or(...matchedUserIds.map((userId) => eq(usersTable.id, userId))))
//     .groupBy(
//       usersTable.id,
//       locationsTable.id,
//       imagesTable.id,
//       // userActivityTable.userId,
//     );

//   return uniqueUsers;
// };

import { and, eq, not, or, sql } from 'drizzle-orm';
import { db } from '../db.ts';
import { matchesTable } from '../schema/matchesTable.ts';
import { usersTable } from '../schema/usersTable.ts';
import { locationsTable } from '../schema/locationTable.ts';
import { imagesTable } from '../schema/imagesTable.ts';
import { userActivityTable } from '../schema/userActivityTable.ts';

export const getMatches = async (id: string) => {
  const matches = await db
    .select({
      match: matchesTable,
      user: usersTable,
      location: locationsTable,
      userActivity: userActivityTable,
      images: sql`array_agg(${imagesTable.imageUrl})`.as('images'),
    })
    .from(matchesTable)
    .where(
      and(
        or(eq(matchesTable.user1Id, id), eq(matchesTable.user2Id, id)),
        not(eq(usersTable.id, id)),
      ),
    )
    .leftJoin(
      usersTable,
      or(
        eq(matchesTable.user1Id, usersTable.id),
        eq(matchesTable.user2Id, usersTable.id),
      ),
    )
    .leftJoin(locationsTable, eq(usersTable.id, locationsTable.userId))
    .leftJoin(userActivityTable, eq(usersTable.id, userActivityTable.userId))
    .leftJoin(imagesTable, eq(usersTable.id, imagesTable.userId))
    .groupBy(
      matchesTable.user1Id,
      matchesTable.user2Id,
      matchesTable.matchedAt,
      matchesTable.status,
      usersTable.id,
      locationsTable.id,
      userActivityTable.userId,
    );

  return matches;
};
