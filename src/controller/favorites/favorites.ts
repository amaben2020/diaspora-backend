import { imagesTable } from './../../schema/imagesTable.ts';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db.ts';
import { usersTable } from '../../schema/usersTable.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { favoritesTable } from '../../schema/favoriteTable.ts';

export const addFavoriteController = tryCatchFn(async (req, res) => {
  const { userId, favoriteUserId } = req.body;

  if (!userId || !favoriteUserId) {
    return res.status(400).json({ error: 'Missing userId or favoriteUserId' });
  }

  // Check if users exist
  //TODO: We already have this helper, would fix after testing
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  const [favoriteUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, favoriteUserId))
    .limit(1);

  if (!user || !favoriteUser) {
    return res.status(404).json({ error: 'One or both users not found' });
  }

  // Check if favorite already exists
  const existingFavorite = await db
    .select()
    .from(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, userId),
        eq(favoritesTable.favoriteUserId, favoriteUserId),
      ),
    );

  if (existingFavorite.length > 0) {
    return res.status(400).json({ error: 'User is already a favorite' });
  }

  const [favorite] = await db
    .insert(favoritesTable)
    .values({ userId, favoriteUserId })
    .returning();

  return res.status(201).json(favorite);
});

export const removeFavoriteController = tryCatchFn(async (req, res) => {
  const { userId, favoriteUserId } = req.params;

  if (!userId || !favoriteUserId) {
    return res.status(400).json({ error: 'Missing userId or favoriteUserId' });
  }

  const result = await db
    .delete(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, userId),
        eq(favoritesTable.favoriteUserId, favoriteUserId),
      ),
    )
    .returning();

  if (result.length === 0) {
    return res.status(404).json({ error: 'Favorite not found' });
  }

  return res.status(200).json({ success: true });
});

export const getFavoritesController = tryCatchFn(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const favorites = await db
    .select({
      id: favoritesTable.id,
      favoriteUserId: favoritesTable.favoriteUserId,
      createdAt: favoritesTable.createdAt,
      user: {
        id: usersTable.id,
        name: usersTable.displayName,
        email: usersTable.email,
      },
      image: sql<string>`(
        SELECT ${imagesTable.imageUrl} 
        FROM ${imagesTable} 
        WHERE ${imagesTable.userId} = ${favoritesTable.favoriteUserId}
        LIMIT 1
      )`.as('image'),
    })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId))
    .leftJoin(usersTable, eq(favoritesTable.favoriteUserId, usersTable.id));

  return res.status(200).json(favorites);
});
