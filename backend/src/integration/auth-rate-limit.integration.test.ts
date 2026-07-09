import { describe, expect, it } from "vitest";

import { assertRateLimit } from "../services/auth-rate-limit.service.js";

describe("auth-rate-limit integration", () => {
  it("stores counters in real Redis and blocks requests past the configured limit", async () => {
    const key = `login-${Date.now()}`;

    await expect(
      assertRateLimit({
        bucket: "integration-login",
        key,
        limit: 1,
        windowMs: 10_000,
      })
    ).resolves.toBeUndefined();

    await expect(
      assertRateLimit({
        bucket: "integration-login",
        key: key.toUpperCase(),
        limit: 1,
        windowMs: 10_000,
      })
    ).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it("allows requests again after the Redis window expires", async () => {
    const key = `login-window-${Date.now()}`;

    await assertRateLimit({
      bucket: "integration-window",
      key,
      limit: 1,
      windowMs: 40,
    });

    await expect(
      assertRateLimit({
        bucket: "integration-window",
        key,
        limit: 1,
        windowMs: 40,
      })
    ).rejects.toMatchObject({ statusCode: 429 });

    await new Promise((resolve) => setTimeout(resolve, 75));

    await expect(
      assertRateLimit({
        bucket: "integration-window",
        key,
        limit: 1,
        windowMs: 40,
      })
    ).resolves.toBeUndefined();
  });
});
