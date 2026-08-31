import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Define type for redis client
type RedisClient = ReturnType<typeof createClient>;

declare global {
  var globalRedis: RedisClient | undefined;
}

let redis: RedisClient;

if (process.env.NODE_ENV === 'production') {
  redis = createClient({ url: redisUrl });
  redis.connect().catch((err) => console.error('[Redis Connect Error]', err));
} else {
  if (!globalThis.globalRedis) {
    globalThis.globalRedis = createClient({ url: redisUrl });
    globalThis.globalRedis.connect().catch((err) => console.error('[Redis Connect Error]', err));
  }
  redis = globalThis.globalRedis;
}

redis.on('error', (err) => console.error('[Redis Client Error]', err));

export { redis };
