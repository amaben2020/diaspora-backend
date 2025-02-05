import { config } from 'dotenv';
import Redis from 'ioredis';

config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || '';

// Parse the Redis URL
const redisUrl = new URL(REDIS_URL);

const redis = new Redis({
  host: redisUrl.hostname,
  port: Number(redisUrl.port),
  username: redisUrl.username || 'default', // Upstash uses 'default' as the username
  password: redisUrl.password,
  tls: {}, // Enable TLS
});

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
