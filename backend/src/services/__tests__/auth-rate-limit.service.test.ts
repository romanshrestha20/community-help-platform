import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRedisClientMock } = vi.hoisted(() => ({
  getRedisClientMock: vi.fn(),
}));

vi.mock("../../lib/redis.js", () => ({
  getRedisClient: getRedisClientMock,
}));

import { assertRateLimit } from "../auth-rate-limit.service.js";

describe("auth-rate-limit.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RATE_LIMIT_FAIL_OPEN;
  });

  it("returns early for blank keys", async () => {
    await expect(
      assertRateLimit({
        bucket: "login",
        key: "   ",
        limit: 1,
        windowMs: 1000,
      })
    ).resolves.toBeUndefined();

    expect(getRedisClientMock).not.toHaveBeenCalled();
  });

  it("falls back to the in-memory limiter when Redis is unavailable", async () => {
    getRedisClientMock.mockResolvedValue(null);
    const key = `user-${Date.now()}`;

    await expect(
      assertRateLimit({
        bucket: "login",
        key,
        limit: 2,
        windowMs: 1000,
      })
    ).resolves.toBeUndefined();

    await expect(
      assertRateLimit({
        bucket: "login",
        key,
        limit: 2,
        windowMs: 1000,
      })
    ).resolves.toBeUndefined();

    await expect(
      assertRateLimit({
        bucket: "login",
        key,
        limit: 2,
        windowMs: 1000,
      })
    ).rejects.toMatchObject({
      message: "Too many requests. Please try again later.",
      statusCode: 429,
    });
  });

  it("uses Redis incr/pexpire when a Redis client is available", async () => {
    const redisMock = {
      incr: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2),
      pexpire: vi.fn().mockResolvedValue(1),
    };
    getRedisClientMock.mockResolvedValue(redisMock);

    await expect(
      assertRateLimit({
        bucket: "login",
        key: "User@Example.com",
        limit: 1,
        windowMs: 5000,
      })
    ).resolves.toBeUndefined();

    expect(redisMock.incr).toHaveBeenCalledWith("login:user@example.com");
    expect(redisMock.pexpire).toHaveBeenCalledWith("login:user@example.com", 5000);

    await expect(
      assertRateLimit({
        bucket: "login",
        key: "User@Example.com",
        limit: 1,
        windowMs: 5000,
      })
    ).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it("fails closed when Redis errors and fail-open is disabled", async () => {
    process.env.RATE_LIMIT_FAIL_OPEN = "false";
    getRedisClientMock.mockRejectedValue(new Error("redis down"));

    await expect(
      assertRateLimit({
        bucket: "login",
        key: "user@example.com",
        limit: 1,
        windowMs: 1000,
      })
    ).rejects.toMatchObject({
      message: "Rate limiter is unavailable.",
      statusCode: 503,
    });
  });
});
