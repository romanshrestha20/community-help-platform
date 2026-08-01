import { prisma } from "../lib/prisma.js";
import { getRedisClient, isRedisConfigured } from "../lib/redis.js";

type DependencyState = "ok" | "disabled" | "error";

export type ReadinessResult = {
  ready: boolean;
  dependencies: {
    database: DependencyState;
    redis: DependencyState;
  };
};

export const checkReadiness = async (): Promise<ReadinessResult> => {
  let database: DependencyState = "ok";
  let redis: DependencyState = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  try {
    const client = await getRedisClient();
    if (!client) {
      redis = isRedisConfigured ? "error" : "disabled";
    } else {
      await client.ping();
    }
  } catch {
    redis = "error";
  }

  const redisRequired =
    process.env.NODE_ENV === "production" ||
    process.env.STRICT_REDIS_STARTUP?.trim().toLowerCase() === "true";

  return {
    ready: database === "ok" && (!redisRequired || redis === "ok"),
    dependencies: { database, redis },
  };
};
