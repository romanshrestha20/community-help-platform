import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";
import { accessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { generateSecureToken, hashToken } from "../utils/token.js";
import { SecurityEventType } from "../../generated/prisma/client.js";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const buildExpiryDate = () => new Date(Date.now() + REFRESH_TTL_MS);

const getUserAgent = (value?: string | string[]) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const getUserTokenVersion = async (userId: string) => {
  const user = await prisma.userModel.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });

  if (!user) {
    throw new AppError("Unauthorized", 401);
  }

  return user.tokenVersion;
};

export const issueSessionTokens = async ({
  userId,
  ipAddress,
  userAgent,
  invalidateAllExisting = false,
}: {
  userId: string;
  ipAddress?: string;
  userAgent?: string | string[];
  invalidateAllExisting?: boolean;
}) => {
  if (invalidateAllExisting) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "REPLACED_BY_NEW_LOGIN" },
    });
  }

  const jti = generateSecureToken(16);
  const familyId = generateSecureToken(16);
  const refreshToken = signRefreshToken({ userId, jti, familyId });
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = buildExpiryDate();

  await prisma.refreshToken.create({
    data: {
      userId,
      jti,
      familyId,
      tokenHash: refreshTokenHash,
      expiresAt,
      createdByIp: ipAddress ?? null,
      lastUsedIp: ipAddress ?? null,
      userAgent: getUserAgent(userAgent),
      lastUsedAt: new Date(),
    },
  });

  const tokenVersion = await getUserTokenVersion(userId);

  return {
    accessToken: accessToken({ userId, tokenVersion }),
    refreshToken,
  };
};

export const rotateRefreshToken = async ({
  refreshToken,
  ipAddress,
  userAgent,
}: {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string | string[];
}) => {
  const decoded = verifyRefreshToken(refreshToken);
  const refreshTokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: refreshTokenHash },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.jti !== decoded.jti || storedToken.familyId !== decoded.familyId) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: storedToken.familyId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokedReason: "TOKEN_REUSE_DETECTED",
      },
    });

    await prisma.securityEvent.create({
      data: {
        userId: storedToken.userId,
        type: SecurityEventType.REFRESH_TOKEN_REUSE_DETECTED,
        ipAddress: ipAddress ?? null,
        userAgent: getUserAgent(userAgent),
        metadata: {
          familyId: storedToken.familyId,
          reusedJti: storedToken.jti,
        },
      },
    });

    throw new AppError("Session compromised. Please log in again.", 401);
  }

  if (storedToken.expiresAt <= new Date()) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        revokedReason: "EXPIRED",
      },
    });
    throw new AppError("Session expired. Please login again.", 401);
  }

  const nextJti = generateSecureToken(16);
  const nextRefreshToken = signRefreshToken({
    userId: decoded.userId,
    jti: nextJti,
    familyId: storedToken.familyId,
  });
  const nextTokenHash = hashToken(nextRefreshToken);
  const expiresAt = buildExpiryDate();

  const nextStoredToken = await prisma.refreshToken.create({
    data: {
      userId: storedToken.userId,
      jti: nextJti,
      familyId: storedToken.familyId,
      tokenHash: nextTokenHash,
      expiresAt,
      createdByIp: storedToken.createdByIp,
      lastUsedIp: ipAddress ?? null,
      userAgent: getUserAgent(userAgent) ?? storedToken.userAgent,
      lastUsedAt: new Date(),
    },
    select: { id: true },
  });

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: {
      revokedAt: new Date(),
      revokedReason: "ROTATED",
      replacedByTokenId: nextStoredToken.id,
      lastUsedAt: new Date(),
      lastUsedIp: ipAddress ?? null,
    },
  });

  const tokenVersion = await getUserTokenVersion(decoded.userId);

  return {
    accessToken: accessToken({ userId: decoded.userId, tokenVersion }),
    refreshToken: nextRefreshToken,
  };
};

export const revokeSessionByRefreshToken = async ({
  refreshToken,
  expectedUserId,
  reason = "USER_LOGOUT",
}: {
  refreshToken: string;
  expectedUserId?: string;
  reason?: string;
}) => {
  const refreshTokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: refreshTokenHash },
    select: { id: true, userId: true, revokedAt: true },
  });

  if (!storedToken) {
    return;
  }

  if (expectedUserId && storedToken.userId !== expectedUserId) {
    throw new AppError("Forbidden", 403);
  }

  if (!storedToken.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  await prisma.userModel.update({
    where: { id: storedToken.userId },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  });

  try {
    await prisma.securityEvent.create({
      data: {
        userId: storedToken.userId,
        type: SecurityEventType.REFRESH_TOKEN_REVOKED,
        metadata: {
          reason,
        },
      },
    });
  } catch (error) {
    // Do not fail logout when audit logging is unavailable or schema is lagging.
    console.error("Failed to persist logout security event:", error);
  }
};

export const revokeAllSessionsForUser = async (userId: string, reason = "USER_LOGOUT_ALL") => {
  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    }),
    prisma.userModel.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    }),
  ]);

  try {
    await prisma.securityEvent.create({
      data: {
        userId,
        type: SecurityEventType.REFRESH_TOKEN_REVOKED,
        metadata: {
          reason,
          scope: "ALL_SESSIONS",
        },
      },
    });
  } catch (error) {
    // Do not fail logout-all when audit logging is unavailable or schema is lagging.
    console.error("Failed to persist logout-all security event:", error);
  }
};

export const listUserSessions = async (userId: string) => {
  const sessions = await prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      familyId: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
      revokedReason: true,
      createdByIp: true,
      lastUsedIp: true,
      userAgent: true,
      lastUsedAt: true,
    },
    take: 20,
  });

  return sessions;
};
