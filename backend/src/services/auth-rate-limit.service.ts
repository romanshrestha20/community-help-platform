import AppError from "../utils/appError.js";
import { getRedisClient } from "../lib/redis.js";

type RateLimitOptions = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

const getRateLimitCacheKey = (bucket: string, key: string) => {
  return `${bucket}:${key}`;
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
      throw new AppError("Rate limiter is unavailable.", 503);
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
