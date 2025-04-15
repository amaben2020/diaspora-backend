import redis, { redisClient } from './redis.ts';

// TODO: do this for likes, dislikes, favorites,
// Function to invalidate user cache when blocking occurs
export const invalidateUserCache = async (userId: string) => {
  const keys = await redis.keys(`all-users-with-locations-${userId}-*`);
  if (keys.length > 0) {
    await Promise.all(keys.map((key) => redisClient.del(key)));
  }
};
