import AppError from "../utils/appError.js";

type RateLimitOptions = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

const getRateLimitCacheKey = (bucket: string, key: string) => {
  return `${bucket}:${key}`;
};

const pruneExpiredRateLimitEntries = (now: number) => {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
};

export const assertRateLimit = ({
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

  const now = Date.now();
  pruneExpiredRateLimitEntries(now);

  const cacheKey = getRateLimitCacheKey(bucket, normalizedKey);
  const existing = rateLimitStore.get(cacheKey);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(cacheKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (existing.count >= limit) {
    throw new AppError(message, 429);
  }

  existing.count += 1;
  rateLimitStore.set(cacheKey, existing);
};

export const clearRateLimitStore = () => {
  rateLimitStore.clear();
};
