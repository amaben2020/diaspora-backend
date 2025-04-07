import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL!;

export const redisConnection = new IORedis({
  host: redisUrl.split('@')[1].split(':')[0],
  port: +redisUrl.split('@')[1].split(':')[1],
  password: redisUrl.split(':')[2].split('@')[0],
  tls: {}, // Required for Upstash
  maxRetriesPerRequest: null,
});
