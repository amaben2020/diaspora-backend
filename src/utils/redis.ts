// import { config } from 'dotenv';
// import Redis from 'ioredis';

// config({ path: '.env' });

// const REDIS_URL = process.env.REDIS_URL || '';

// // Parse the Redis URL
// const redisUrl = new URL(REDIS_URL);

// const redis = new Redis({
//   host: redisUrl.hostname,
//   port: Number(redisUrl.port),
//   username: redisUrl.username || 'default', // Upstash uses 'default' as the username
//   password: redisUrl.password,
//   tls: {}, // Enable TLS
// });

// redis.on('connect', () => console.log('Connected to Redis'));
// redis.on('error', (err) => console.error('Redis Error:', err));

// export const redisClient = {
//   get: async (key: string) => {
//     return await redis.get(key);
//   },
//   set: async (key: string, value: string, expire?: number) => {
//     if (expire) {
//       await redis.set(key, value, 'EX', expire);
//     } else {
//       await redis.set(key, value);
//     }
//   },
//   del: async (key: string) => {
//     await redis.del(key);
//   },
// };

// export default redis;

import { config } from 'dotenv';
import Redis from 'ioredis';

config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || '';

// Singleton pattern for Redis connection
let redisInstance: Redis | null = null;

const getRedisInstance = (): Redis => {
  if (redisInstance !== null) {
    return redisInstance;
  }

  // Parse the Redis URL
  const redisUrl = new URL(REDIS_URL);

  const redis = new Redis({
    host: redisUrl.hostname,
    port: Number(redisUrl.port),
    username: redisUrl.username || 'default',
    password: redisUrl.password,
    tls: {},
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      // Exponential backoff with max 3 second delay
      return Math.min(times * 50, 3000);
    },
    // Set sensible connection limits
    connectionName: 'app-main-connection',
    enableOfflineQueue: true,
    connectTimeout: 10000, // 10 seconds
  });

  redis.on('connect', () => console.log('Connected to Redis'));
  redis.on('ready', () => console.log('Redis connection ready'));
  redis.on('error', (err) => {
    console.error('Redis Error:', err);
    // Don't destroy the instance on error - allow retry strategy to work
  });
  redis.on('close', () => console.log('Redis connection closed'));
  redis.on('reconnecting', () => console.log('Reconnecting to Redis...'));

  redisInstance = redis;
  return redis;
};

export const redisClient = {
  get: async (key: string) => {
    return await getRedisInstance().get(key);
  },
  set: async (key: string, value: string, expire?: number) => {
    if (expire) {
      await getRedisInstance().set(key, value, 'EX', expire);
    } else {
      await getRedisInstance().set(key, value);
    }
  },
  del: async (key: string) => {
    await getRedisInstance().del(key);
  },
  // Add a proper shutdown method to gracefully close connections
  shutdown: async () => {
    if (redisInstance) {
      await redisInstance.quit();
      redisInstance = null;
      console.log('Redis connection properly closed');
    }
  },
};

// Export the getter function to allow direct access when needed
const redis = getRedisInstance();

export default redis;
