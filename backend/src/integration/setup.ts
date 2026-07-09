import { afterAll, beforeAll, beforeEach } from "vitest";

import { prisma } from "../lib/prisma.js";
import { getRedisClient } from "../lib/redis.js";
import { clearRateLimitStore } from "../services/auth-rate-limit.service.js";

const assertSafeTestEnvironment = () => {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set for integration tests.");
  }

  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.replace(/^\//, "");

  if (!/test/i.test(databaseName)) {
    throw new Error(`Refusing to run integration tests against non-test database "${databaseName}".`);
  }
};

const truncateAllTables = async () => {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const quotedTables = tables.map(({ tablename }) => `"public"."${tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
};

beforeAll(async () => {
  assertSafeTestEnvironment();
  await prisma.$queryRaw`SELECT 1`;

  const redis = await getRedisClient();
  if (!redis) {
    throw new Error("Redis client is unavailable for integration tests.");
  }

  await redis.ping();
});

beforeEach(async () => {
  await truncateAllTables();
  await clearRateLimitStore();
});

afterAll(async () => {
  try {
    await clearRateLimitStore();
  } catch {
    // Ignore cleanup failures on shutdown.
  }

  try {
    const redis = await getRedisClient();
    if (redis?.isOpen) {
      await redis.quit();
    }
  } catch {
    // Ignore shutdown failures on cached redis client.
  }

  await prisma.$disconnect();
});
