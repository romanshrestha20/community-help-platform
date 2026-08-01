import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL?.trim();
const isProduction = process.env.NODE_ENV === "production";

export const isRedisConfigured = Boolean(redisUrl);

let redisClient: ReturnType<typeof createClient> | null = null;
let hasInitAttempted = false;
let connectPromise: Promise<ReturnType<typeof createClient> | null> | null = null;
let retryAfter = 0;

const retryCooldownMs = Math.max(
  1_000,
  Number(process.env.REDIS_RETRY_COOLDOWN_MS) || 30_000,
);

const buildClient = () => {
  if (!redisUrl) {
    if (isProduction) {
      throw new Error("REDIS_URL must be set in production.");
    }
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(redisUrl);
  } catch {
    throw new Error("REDIS_URL is not a valid URL.");
  }

  if (parsedUrl.protocol !== "redis:" && parsedUrl.protocol !== "rediss:") {
    throw new Error(
      "REDIS_URL must use redis:// or rediss:// (do not use Upstash REST https:// URL)."
    );
  }

  return createClient({
    url: redisUrl,
    socket: {
      ...(parsedUrl.protocol === "rediss:"
        ? {
            tls: true as const,
            servername: parsedUrl.hostname,
          }
        : {}),
      reconnectStrategy: (retries) => {
        // Stop retrying after a short burst to avoid log spam.
        const maxRetries = isProduction ? 5 : 2;
        if (retries > maxRetries) return false;
        return Math.min(retries * 200, 1500);
      },
    },
  });
};

export const getRedisClient = async () => {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (Date.now() < retryAfter) {
    return null;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    if (!hasInitAttempted) {
      hasInitAttempted = true;
      redisClient = buildClient();
      if (!redisClient) {
        return null;
      }

      // Connection failures are surfaced to the caller and logged once with
      // operation context. An error listener is still required by node-redis.
      redisClient.on("error", () => undefined);
    }

    if (!redisClient) {
      return null;
    }

    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      retryAfter = 0;
      return redisClient;
    } catch (error) {
      try {
        redisClient.destroy();
      } catch {
        // The socket may already have been destroyed by the failed connection.
      }

      redisClient = null;
      hasInitAttempted = false;
      retryAfter = Date.now() + retryCooldownMs;
      throw error;
    }
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
};

export const assertRedisReady = async () => {
  const client = await getRedisClient();

  if (!client) {
    if (isProduction) {
      throw new Error("Redis client is unavailable in production.");
    }
    return null;
  }

  await client.ping();
  return client;
};

export const closeRedisClient = async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }

  redisClient = null;
  hasInitAttempted = false;
  connectPromise = null;
  retryAfter = 0;
};
