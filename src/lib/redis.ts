import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Define type for redis client
type RedisClient = ReturnType<typeof createClient>;

declare global {
  var globalRedis: RedisClient | undefined;
}

let redis: RedisClient;

const clientOptions = {
  url: redisUrl,
  socket: {
    reconnectStrategy: false, // Disable infinite retries
  },
};

if (process.env.NODE_ENV === 'production') {
  redis = createClient(clientOptions);
  redis.connect().catch(() => console.warn('[Redis] Connection failed, falling back to in-memory/fail-open.'));
} else {
  if (!globalThis.globalRedis) {
    globalThis.globalRedis = createClient(clientOptions);
    globalThis.globalRedis.connect().catch(() => console.warn('[Redis] Connection failed, falling back to in-memory/fail-open.'));
  }
  redis = globalThis.globalRedis;
}

redis.on('error', (err: any) => {
  if (err?.code !== 'ECONNREFUSED' && err?.code !== 'ENOTFOUND') {
    console.error('[Redis Client Error]', err);
  }
});

export { redis };
