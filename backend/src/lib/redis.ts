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

  return createClient({ url: redisUrl });
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
