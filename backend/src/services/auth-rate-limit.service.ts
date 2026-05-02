import AppError from "../utils/appError.js";
import { getRedisClient } from "../lib/redis.js";

type RateLimitOptions = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

type InMemoryEntry = {
  count: number;
  expiresAt: number;
};

const getRateLimitCacheKey = (bucket: string, key: string) => {
  return `${bucket}:${key}`;
};

const inMemoryRateLimitStore = new Map<string, InMemoryEntry>();

const shouldFailOpenOnLimiterError = () => {
  const raw = process.env.RATE_LIMIT_FAIL_OPEN?.trim().toLowerCase();
  if (!raw) return true;
  return raw === "1" || raw === "true" || raw === "yes";
};

const assertInMemoryRateLimit = ({
  cacheKey,
  limit,
  windowMs,
  message,
}: {
  cacheKey: string;
  limit: number;
  windowMs: number;
  message: string;
}) => {
  const now = Date.now();
  const existing = inMemoryRateLimitStore.get(cacheKey);

  if (!existing || existing.expiresAt <= now) {
    inMemoryRateLimitStore.set(cacheKey, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return;
  }

  const nextCount = existing.count + 1;
  inMemoryRateLimitStore.set(cacheKey, {
    ...existing,
    count: nextCount,
  });

  if (nextCount > limit) {
    throw new AppError(message, 429);
  }
};

export const assertRateLimit = async ({
  bucket,
  key,
  limit,
  windowMs,
  message = "Too many requests. Please try again later.",
}: RateLimitOptions) => {
  const normalizedKey = key.trim().toLowerCase();

  if (!normalizedKey) {
    return;
  }

  try {
    const redis = await getRedisClient();
    if (!redis) {
      const cacheKey = getRateLimitCacheKey(bucket, normalizedKey);
      assertInMemoryRateLimit({ cacheKey, limit, windowMs, message });
      return;
    }

    const cacheKey = getRateLimitCacheKey(bucket, normalizedKey);
    const count = await redis.incr(cacheKey);
    if (count === 1) {
      await redis.pexpire(cacheKey, windowMs);
    }

    if (count > limit) {
      throw new AppError(message, 429);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (shouldFailOpenOnLimiterError()) {
      console.warn("[rate-limit] Redis unavailable. Falling back to in-memory limiter.", {
        bucket,
      });
      const cacheKey = getRateLimitCacheKey(bucket, normalizedKey);
      assertInMemoryRateLimit({ cacheKey, limit, windowMs, message });
      return;
    }

    throw new AppError("Rate limiter is unavailable.", 503);
  }
};

export const clearRateLimitStore = async () => {
  const redis = await getRedisClient();
  if (!redis) {
    return;
  }
  await redis.flushDb();
};
