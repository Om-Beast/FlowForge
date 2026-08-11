import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../utils';
import { ApiError } from '../shared/errors';
import { IDEMPOTENCY_KEY_HEADER, IDEMPOTENCY_TTL_SECONDS } from '../shared/constants';

interface CachedResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  processedAt: string;
}

/**
 * Idempotency middleware for POST/PATCH endpoints.
 * If the same Idempotency-Key header is sent within TTL,
 * returns the cached response without re-processing.
 */
export const idempotency =
  (ttlSeconds = IDEMPOTENCY_TTL_SECONDS) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!['POST', 'PATCH', 'PUT'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER.toLowerCase()] as string | undefined;
    if (!idempotencyKey) return next();

    // Validate key format (UUID-like)
    if (!/^[\w\-]{8,128}$/.test(idempotencyKey)) {
      next(ApiError.badRequest('Invalid Idempotency-Key format'));
      return;
    }

    const redis = getRedisClient();
    const redisKey = `idempotency:${idempotencyKey}`;

    try {
      const cached = await redis.get(redisKey);

      if (cached) {
        const parsed: CachedResponse = JSON.parse(cached);
        res.setHeader('X-Idempotent-Replayed', 'true');
        for (const [header, value] of Object.entries(parsed.headers)) {
          res.setHeader(header, value);
        }
        res.status(parsed.statusCode).json(parsed.body);
        return;
      }

      // Intercept the response to cache it
      const originalJson = res.json.bind(res);
      res.json = (body: unknown): Response => {
        if (res.statusCode < 500) {
          const toCache: CachedResponse = {
            statusCode: res.statusCode,
            body,
            headers: {
              'Content-Type': 'application/json',
            },
            processedAt: new Date().toISOString(),
          };
          // Fire-and-forget cache write
          redis.setex(redisKey, ttlSeconds, JSON.stringify(toCache)).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      // Fail open — proceed without idempotency caching
      next();
    }
  };
