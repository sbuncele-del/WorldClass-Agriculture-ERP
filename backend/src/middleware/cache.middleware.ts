import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';

type KeyBuilder = (req: Request) => string;

interface CacheOptions {
  prefix: string;
  ttlSeconds: number;
  keyBuilder?: KeyBuilder;
}

/**
 * Cache middleware with TTL and automatic invalidation hook.
 * - Builds cache key from prefix + keyBuilder (defaults to URL + query string).
 * - Serves cached response if present.
 * - Stores response body after handler executes.
 */
export const createCacheMiddleware = ({ prefix, ttlSeconds, keyBuilder }: CacheOptions) => {
  const buildKey: KeyBuilder = keyBuilder || ((req) => `${prefix}:${req.originalUrl}`);

  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = buildKey(req);
    try {
      const cached = await redisService.get<any>(cacheKey);
      if (cached) {
        return res.json({ ...cached, _cache: { hit: true, key: cacheKey, ttlSeconds } });
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        void redisService.set(cacheKey, body, ttlSeconds);
        return originalJson(body);
      };

      return next();
    } catch (error) {
      console.warn('Cache middleware bypassed due to error:', error);
      return next();
    }
  };
};

/**
 * Simple helper to invalidate cached prefix for mutation endpoints.
 */
export const invalidateCachePrefix = async (prefix: string) => {
  await redisService.flushPrefix(prefix);
};
