import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../utils';
import { ApiError } from '../shared/errors';
import { AuthenticatedRequest } from '../shared/types';
import { appConfig } from '../config';

interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  identifierFn?: (req: Request) => string;
}

/**
 * Sliding-window rate limiter backed by Redis sorted sets.
 * Each request is scored by its timestamp and old entries are pruned
 * per window to give a true sliding window count.
 */
export const rateLimiter = (options: RateLimiterOptions = {}) => {
  const {
    windowMs = appConfig.rateLimit.windowMs,
    maxRequests = appConfig.rateLimit.maxRequests,
    keyPrefix = 'rl',
    identifierFn,
  } = options;

  const windowSec = Math.ceil(windowMs / 1000);

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const redis = getRedisClient();

    const user = (req as AuthenticatedRequest).user;
    const identifier =
      identifierFn?.(req) ??
      user?.id ??
      req.ip ??
      'anonymous';

    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const pipeline = redis.pipeline();
      // Remove timestamps outside the current window
      pipeline.zremrangebyscore(key, '-inf', windowStart);
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      // Count requests in window
      pipeline.zcard(key);
      // Set TTL
      pipeline.expire(key, windowSec);

      const results = await pipeline.exec();
      const count = (results?.[2]?.[1] as number) ?? 0;

      const remaining = Math.max(0, maxRequests - count);
      const resetAt = new Date(now + windowMs).toISOString();

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetAt);

      if (count > maxRequests) {
        const retryAfter = Math.ceil(windowMs / 1000);
        res.setHeader('Retry-After', retryAfter);
        next(ApiError.tooManyRequests('Rate limit exceeded', retryAfter));
        return;
      }

      next();
    } catch (err) {
      // Fail open — don't block requests if Redis is unavailable
      next();
    }
  };
};

/**
 * Strict rate limiter for auth endpoints (more restrictive).
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyPrefix: 'rl:auth',
  identifierFn: (req) => req.ip ?? 'anonymous',
});
