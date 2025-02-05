import { config } from 'dotenv';
import Redis from 'ioredis';

config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || '';

const redis = new Redis(REDIS_URL);

redis.on('connect', () => console.log('Connected to Redis'));
redis.on('error', (err) => console.error('Redis Error:', err));

export const redisClient = {
  get: async (key: string) => {
    return await redis.get(key);
  },
  set: async (key: string, value: string, expire?: number) => {
    if (expire) {
      await redis.set(key, value, 'EX', expire);
    } else {
      await redis.set(key, value);
    }
  },
  del: async (key: string) => {
    await redis.del(key);
  },
};

export default redis;
