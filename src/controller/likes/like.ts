import { eq } from 'drizzle-orm';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { db } from '../../db.ts';
import { likesTable } from '../../schema/likesTable.ts';

export const likeUserController = tryCatchFn(async (req, res, next) => {
  const { likerId, likedId } = req.body;

  // TODO: check if both users exist before proceeding

  if (!likerId || !likedId) {
    res.status(400).json({ error: 'Missing likerId or likedId' });
    next('Something went wrong');
  }

  // Check if the like already exists
  const existingLike = await db
    .select()
    .from(likesTable)
    .where(eq(likesTable.likerId, likerId) && eq(likesTable.likedId, likedId));

  if (existingLike.length > 0) {
    return res.status(400).json({ error: 'Like already exists' });
  }

  // Insert the like into the database
  const [like = undefined] = await db
    .insert(likesTable)
    .values({ likerId, likedId })
    .returning();

  // Check for a match (if the liked user has also liked the liker)
  const match = await db
    .select()
    .from(likesTable)
    .where(eq(likesTable.likerId, likedId) && eq(likesTable.likedId, likerId));

  if (match.length > 0) {
    // Notify both users of the match
    // You can use WebSocket or a notification service here
    console.log('Match found! or ITS A MATCH!', { likerId, likedId });
  }

  return res.status(201).json(like);
});

//TODO: Create a liked users catalogue

// cors: {
//       origin: "https://riggle.onrender.com",
//       methods: ["GET", "POST"]
//   }

// Dislike a user (just prevent from showing again)
// router.post('/dislike', async (req, res) => {
//   try {
//     const { likerId, likedId } = req.body;
//     if (!likerId || !likedId) {
//       return res.status(400).json({ message: 'Missing user IDs' });
//     }

//     // Remove like if it exists (optional)
//     await db.delete(likesTable).where(
//       and(eq(likesTable.likerId, likerId), eq(likesTable.likedId, likedId))
//     );

//     res.json({ message: 'User disliked successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Internal Server Error', error });
//   }
// });

// export default router;
