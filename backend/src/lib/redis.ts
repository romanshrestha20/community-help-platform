import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL?.trim();
const isProduction = process.env.NODE_ENV === "production";

let redisClient: ReturnType<typeof createClient> | null = null;
let hasInitAttempted = false;

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
      reconnectStrategy: (retries) => {
        // Stop retrying after a short burst to avoid log spam.
        if (retries > 5) return false;
        return Math.min(retries * 200, 1500);
      },
    },
  });
};

export const getRedisClient = async () => {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (!hasInitAttempted) {
    hasInitAttempted = true;
    redisClient = buildClient();
    if (!redisClient) {
      return null;
    }

    redisClient.on("error", (error) => {
      console.error("[redis] client error", error);
    });
  }

  if (!redisClient) {
    return null;
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
};
