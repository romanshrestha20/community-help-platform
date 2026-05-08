import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashToken } from "../../utils/token.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    refreshToken: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    userModel: {
      update: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

import { revokeSessionByRefreshToken } from "../session.service.js";
import { revokeOtherSessionsForUser, revokeSessionById } from "../session.service.js";

describe("session.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.refreshToken.findMany.mockResolvedValue([]);
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.userModel.update.mockResolvedValue({ id: "user-1" });
    prismaMock.securityEvent.create.mockResolvedValue({ id: "evt-1" });
  });

  it("revokeSessionByRefreshToken: revokes active tokens in the same family when submitted token is already rotated", async () => {
    const rotatedRefreshToken = "old-rotated-refresh-token";
    const tokenHash = hashToken(rotatedRefreshToken);

    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "token-old",
      userId: "user-1",
      familyId: "family-1",
      revokedAt: new Date("2026-05-08T10:00:00.000Z"),
    });

    await revokeSessionByRefreshToken({
      refreshToken: rotatedRefreshToken,
      expectedUserId: "user-1",
      reason: "USER_LOGOUT_CURRENT",
    });

    expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash },
      select: { id: true, userId: true, familyId: true, revokedAt: true },
    });
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        familyId: "family-1",
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
        revokedReason: "USER_LOGOUT_CURRENT",
      },
    });
    expect(prismaMock.userModel.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  });

  it("revokeSessionById: increments tokenVersion when a target session is revoked", async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(undefined);
    prismaMock.refreshToken.findFirst = vi.fn().mockResolvedValue({
      id: "session-2",
      revokedAt: null,
    });
    prismaMock.refreshToken.update = vi.fn().mockResolvedValue({
      id: "session-2",
    });
    prismaMock.$transaction = vi.fn().mockResolvedValue([]);

    await revokeSessionById({
      sessionId: "session-2",
      userId: "user-1",
      reason: "USER_REVOKED_SESSION",
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.anything(),
        expect.anything(),
      ]),
    );
  });

  it("revokeOtherSessionsForUser: increments tokenVersion when any other sessions are revoked", async () => {
    prismaMock.refreshToken.findMany.mockResolvedValueOnce([
      { id: "session-b" },
      { id: "session-c" },
    ]);
    prismaMock.refreshToken.updateMany.mockResolvedValueOnce({ count: 2 });

    await revokeOtherSessionsForUser({
      userId: "user-1",
      currentRefreshTokenHash: "current-hash",
      reason: "USER_LOGOUT_OTHERS",
    });

    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
        tokenHash: { not: "current-hash" },
      },
      data: {
        revokedAt: expect.any(Date),
        revokedReason: "USER_LOGOUT_OTHERS",
      },
    });
    expect(prismaMock.userModel.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  });
});
