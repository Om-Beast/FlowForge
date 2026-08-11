/**
 * CacheService
 *
 * A thin, opinionated abstraction over ioredis that provides:
 *   - Typed get/set with automatic JSON serialisation
 *   - TTL management (default 5 minutes)
 *   - Namespace-scoped key helpers so modules never collide
 *   - Pattern-based cache invalidation (flushNamespace)
 *   - Atomic remember() helper (cache-aside pattern)
 *
 * Architectural note: This service intentionally does NOT use a dedicated
 * connection. It reuses the shared singleton created by getRedisClient()
 * so that we stay within the ioredis connection-pool budget defined in
 * redis.config.ts.
 */
import { getRedisClient } from '../utils/redis.utils';
import { logger } from '../utils/logger';
import type IORedis from 'ioredis';

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

export class CacheService {
  private readonly redis: IORedis;
  private readonly namespace: string;

  constructor(namespace = 'ff') {
    this.redis = getRedisClient();
    this.namespace = namespace;
  }

  // ── Key helpers ─────────────────────────────────────────────────────────────

  private key(field: string): string {
    return `${this.namespace}:${field}`;
  }

  // ── Core operations ─────────────────────────────────────────────────────────

  async get<T>(field: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(this.key(field));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn('CacheService.get failed', { field, error: (err as Error).message });
      return null;
    }
  }

  async set<T>(field: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      const serialised = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.redis.setex(this.key(field), ttlSeconds, serialised);
      } else {
        await this.redis.set(this.key(field), serialised);
      }
    } catch (err) {
      logger.warn('CacheService.set failed', { field, error: (err as Error).message });
    }
  }

  async del(...fields: string[]): Promise<void> {
    try {
      const keys = fields.map((f) => this.key(f));
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err) {
      logger.warn('CacheService.del failed', { fields, error: (err as Error).message });
    }
  }

  async exists(field: string): Promise<boolean> {
    try {
      return (await this.redis.exists(this.key(field))) === 1;
    } catch {
      return false;
    }
  }

  async ttl(field: string): Promise<number> {
    try {
      return await this.redis.ttl(this.key(field));
    } catch {
      return -1;
    }
  }

  /**
   * Cache-aside / "remember" pattern.
   * Returns cached value if present, otherwise executes `fn`, caches the
   * result, and returns it.
   */
  async remember<T>(
    field: string,
    fn: () => Promise<T>,
    ttlSeconds = DEFAULT_TTL_SECONDS,
  ): Promise<T> {
    const cached = await this.get<T>(field);
    if (cached !== null) return cached;
    const fresh = await fn();
    await this.set(field, fresh, ttlSeconds);
    return fresh;
  }

  /**
   * Invalidate all keys matching the namespace prefix + optional sub-pattern.
   * Uses SCAN instead of KEYS to avoid blocking the event loop.
   */
  async flushNamespace(subPattern = '*'): Promise<number> {
    const pattern = `${this.namespace}:${subPattern}`;
    let cursor = '0';
    let deleted = 0;

    try {
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.warn('CacheService.flushNamespace failed', { pattern, error: (err as Error).message });
    }

    return deleted;
  }

  // ── Atomic counter helpers ───────────────────────────────────────────────────

  async increment(field: string, by = 1): Promise<number> {
    return this.redis.incrby(this.key(field), by);
  }

  async decrement(field: string, by = 1): Promise<number> {
    return this.redis.decrby(this.key(field), by);
  }
}

// ── Singleton namespace instances ────────────────────────────────────────────

export const workflowCache = new CacheService('ff:wf');
export const analyticsCache = new CacheService('ff:analytics');
export const sessionCache = new CacheService('ff:session');
export const rateLimitCache = new CacheService('ff:rl');
