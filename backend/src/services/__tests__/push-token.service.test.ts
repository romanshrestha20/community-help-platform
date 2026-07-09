import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    pushToken: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

import {
  deletePushTokenForUser,
  getPushTokensForUser,
  upsertPushTokenForUser,
} from "../push-token.service.js";

describe("push-token.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upsertPushTokenForUser trims tokens and stores null platform when omitted", async () => {
    prismaMock.pushToken.upsert.mockResolvedValue({
      id: "push-1",
      userId: "user-1",
      token: "ExponentPushToken[abc]",
      platform: null,
    });

    await upsertPushTokenForUser({
      userId: "user-1",
      token: "  ExponentPushToken[abc]  ",
    });

    expect(prismaMock.pushToken.upsert).toHaveBeenCalledWith({
      where: { token: "ExponentPushToken[abc]" },
      create: {
        userId: "user-1",
        token: "ExponentPushToken[abc]",
        platform: null,
      },
      update: {
        userId: "user-1",
        platform: null,
      },
    });
  });

  it("upsertPushTokenForUser rejects blank tokens", async () => {
    await expect(
      upsertPushTokenForUser({
        userId: "user-1",
        token: "   ",
      })
    ).rejects.toThrow("Push token is required");
  });

  it("getPushTokensForUser returns token-only projections", async () => {
    prismaMock.pushToken.findMany.mockResolvedValue([{ token: "a" }, { token: "b" }]);

    const result = await getPushTokensForUser("user-1");

    expect(prismaMock.pushToken.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { token: true },
    });
    expect(result).toEqual([{ token: "a" }, { token: "b" }]);
  });

  it("deletePushTokenForUser trims tokens before deletion", async () => {
    prismaMock.pushToken.deleteMany.mockResolvedValue({ count: 1 });

    await deletePushTokenForUser("user-1", "  ExponentPushToken[abc] ");

    expect(prismaMock.pushToken.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        token: "ExponentPushToken[abc]",
      },
    });
  });
});
