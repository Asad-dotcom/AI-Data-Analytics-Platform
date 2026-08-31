import { redis } from '@/lib/redis';

export const RateLimitingService = {
  /**
   * Sliding window rate limiter using Redis sorted sets.
   * Restricts actions to a maximum of `limit` requests within a sliding window of `windowSeconds`.
   * Useful for API route protection.
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{
    allowed: boolean;
    currentCount: number;
    remaining: number;
  }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const clearBefore = now - windowSeconds * 1000;

    try {
      // Execute multi transaction
      const results = await redis
        .multi()
        .zRemRangeByScore(key, 0, clearBefore) // Remove expired requests outside the window
        .zAdd(key, { score: now, value: `${now}-${Math.random()}` }) // Log current request
        .zCard(key) // Count total requests within sliding window
        .expire(key, windowSeconds) // Renew expiry on the set
        .exec();

      // zCard output is the third command in the multi-exec chain (index 2)
      const currentCount = (results[2] as unknown as number) || 0;
      const allowed = currentCount <= limit;

      return {
        allowed,
        currentCount,
        remaining: Math.max(0, limit - currentCount),
      };
    } catch (error) {
      console.error('[Rate Limiting Service] Redis operation failed:', error);
      // Fallback: allow request in case cache server goes down (fail-open)
      return {
        allowed: true,
        currentCount: 0,
        remaining: limit,
      };
    }
  },
};
