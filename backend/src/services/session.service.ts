import { prisma } from "../lib/prisma.js";
import { getIO } from "../lib/socket.js";
import AppError from "../utils/appError.js";
import {
  accessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { generateSecureToken, hashToken } from "../utils/token.js";
import { Prisma, SecurityEventType } from "../../generated/prisma/client.js";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const buildExpiryDate = () => new Date(Date.now() + REFRESH_TTL_MS);

const getUserAgent = (value?: string | string[]) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const parseDeviceType = (platform?: string | null, userAgent?: string | null) => {
  const haystack = `${platform ?? ""} ${userAgent ?? ""}`.toLowerCase();
  if (haystack.includes("ipad") || haystack.includes("tablet")) return "TABLET";
  if (haystack.includes("android") || haystack.includes("iphone") || haystack.includes("ios")) return "MOBILE";
  if (haystack.includes("mac") || haystack.includes("windows") || haystack.includes("linux")) return "DESKTOP";
  if (haystack.includes("web")) return "WEB";
  return "UNKNOWN";
};

const parseBrowser = (userAgent?: string | null) => {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("expo")) return "Expo";
  return null;
};

const parsePlatform = (explicitPlatform?: string | null, userAgent?: string | null) => {
  if (explicitPlatform?.trim()) return explicitPlatform.trim();
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ios")) return "iOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("linux")) return "Linux";
  return null;
};

const isPrivateIpAddress = (ip?: string | null) => {
  if (!ip) return true;
  const normalized = ip.replace("::ffff:", "").trim().toLowerCase();
  if (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "localhost"
  ) {
    return true;
  }
  if (normalized.startsWith("10.")) return true;
  if (normalized.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  return false;
};

const inferDeviceName = ({
  explicitDeviceName,
  platform,
  browser,
  userAgent,
}: {
  explicitDeviceName?: string | null;
  platform?: string | null;
  browser?: string | null;
  userAgent?: string | null;
}) => {
  if (explicitDeviceName?.trim()) return explicitDeviceName.trim();

  const ua = (userAgent ?? "").toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android") && ua.includes("mobile")) return "Android phone";
  if (ua.includes("android")) return "Android device";
  if (ua.includes("windows")) return `${browser ?? "Browser"} · Windows`;
  if (ua.includes("mac os") || ua.includes("macintosh")) return `${browser ?? "Browser"} · macOS`;
  if (ua.includes("linux")) return `${browser ?? "Browser"} · Linux`;

  const parts = [browser, platform].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  return "Unknown device";
};

const resolveLocationLabelFromIp = async (ipAddress?: string | null) => {
  const enabled = process.env.SESSION_GEOLOCATION_ENABLED === "true";
  if (!enabled || !ipAddress || isPrivateIpAddress(ipAddress)) {
    return null;
  }

  const lookupTimeoutMs = Number(process.env.SESSION_GEOLOCATION_TIMEOUT_MS || 1200);
  const ip = ipAddress.replace("::ffff:", "").trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), lookupTimeoutMs);

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as {
      city?: string;
      country_name?: string;
      error?: boolean;
    };
    if (payload?.error) return null;

    const city = payload.city?.trim();
    const country = payload.country_name?.trim();
    if (city && country) return `${city}, ${country}`;
    return country || city || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const isMissingSecurityEventsTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2021";

const isMissingSessionMetadataColumnError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2022";

const createSecurityEventSafely = async ({
  context,
  data,
}: {
  context: string;
  data: Prisma.SecurityEventUncheckedCreateInput;
}) => {
  try {
    await prisma.securityEvent.create({ data });
  } catch (error) {
    if (isMissingSecurityEventsTableError(error)) {
      console.warn(
        `Security audit table unavailable during ${context}; skipping event persistence.`,
      );
      return;
    }
    console.error(`Failed to persist security event during ${context}:`, error);
  }
};

const emitForcedLogoutToSessions = (sessionIds: string[], reason: string) => {
  if (sessionIds.length === 0) return;

  try {
    const io = getIO();
    for (const sessionId of sessionIds) {
      io.to(`session:${sessionId}`).emit("auth:force_logout", {
        reason,
        sessionId,
        issuedAt: new Date().toISOString(),
      });
    }
  } catch {
    // Socket server may be unavailable in some contexts (e.g., tests).
  }
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
  deviceName,
  platform,
  appVersion,
  locationLabel,
  loginMethod = "EMAIL_PASSWORD",
  invalidateAllExisting = false,
}: {
  userId: string;
  ipAddress?: string;
  userAgent?: string | string[];
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  locationLabel?: string;
  loginMethod?: string;
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

  const normalizedUserAgent = getUserAgent(userAgent);
  const normalizedPlatform = parsePlatform(platform, normalizedUserAgent);
  const normalizedBrowser = parseBrowser(normalizedUserAgent);
  const normalizedDeviceName = inferDeviceName({
    explicitDeviceName: deviceName,
    platform: normalizedPlatform,
    browser: normalizedBrowser,
    userAgent: normalizedUserAgent,
  });
  const resolvedLocationLabel =
    locationLabel?.trim() || (await resolveLocationLabelFromIp(ipAddress)) || null;

  try {
    await prisma.refreshToken.create({
      data: {
        userId,
        jti,
        familyId,
        tokenHash: refreshTokenHash,
        expiresAt,
        createdByIp: ipAddress ?? null,
        lastUsedIp: ipAddress ?? null,
        userAgent: normalizedUserAgent,
        deviceName: normalizedDeviceName,
        deviceType: parseDeviceType(normalizedPlatform, normalizedUserAgent),
        platform: normalizedPlatform,
        browser: normalizedBrowser,
        locationLabel: resolvedLocationLabel,
        appVersion: appVersion?.trim() || null,
        loginMethod,
        lastUsedAt: new Date(),
      },
    });
  } catch (error) {
    if (!isMissingSessionMetadataColumnError(error)) {
      throw error;
    }

    await prisma.refreshToken.create({
      data: {
        userId,
        jti,
        familyId,
        tokenHash: refreshTokenHash,
        expiresAt,
        createdByIp: ipAddress ?? null,
        lastUsedIp: ipAddress ?? null,
        userAgent: normalizedUserAgent,
        lastUsedAt: new Date(),
      },
    });
  }

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
  deviceName,
  platform,
  appVersion,
  locationLabel,
}: {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string | string[];
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  locationLabel?: string;
}) => {
  const decoded = verifyRefreshToken(refreshToken);
  const refreshTokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: refreshTokenHash },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (
    storedToken.jti !== decoded.jti ||
    storedToken.familyId !== decoded.familyId
  ) {
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

    await createSecurityEventSafely({
      context: "refresh token reuse handling",
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

  const normalizedUserAgent = getUserAgent(userAgent) ?? storedToken.userAgent;
  const normalizedPlatform = parsePlatform(platform, normalizedUserAgent);
  const normalizedBrowser = parseBrowser(normalizedUserAgent) ?? storedToken.browser;
  const normalizedDeviceName = inferDeviceName({
    explicitDeviceName: deviceName?.trim() || storedToken.deviceName,
    platform: normalizedPlatform ?? storedToken.platform,
    browser: normalizedBrowser,
    userAgent: normalizedUserAgent,
  });
  const resolvedLocationLabel =
    locationLabel?.trim() ||
    storedToken.locationLabel ||
    (await resolveLocationLabelFromIp(ipAddress)) ||
    null;

  const nextStoredToken = await (async () => {
    try {
      return await prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          jti: nextJti,
          familyId: storedToken.familyId,
          tokenHash: nextTokenHash,
          expiresAt,
          createdByIp: storedToken.createdByIp,
          lastUsedIp: ipAddress ?? null,
          userAgent: normalizedUserAgent,
          deviceName: normalizedDeviceName,
          deviceType: parseDeviceType(normalizedPlatform, normalizedUserAgent),
          platform: normalizedPlatform ?? storedToken.platform,
          browser: normalizedBrowser,
          locationLabel: resolvedLocationLabel,
          appVersion: appVersion?.trim() || storedToken.appVersion,
          loginMethod: storedToken.loginMethod,
          lastUsedAt: new Date(),
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isMissingSessionMetadataColumnError(error)) {
        throw error;
      }

      return prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          jti: nextJti,
          familyId: storedToken.familyId,
          tokenHash: nextTokenHash,
          expiresAt,
          createdByIp: storedToken.createdByIp,
          lastUsedIp: ipAddress ?? null,
          userAgent: normalizedUserAgent,
          lastUsedAt: new Date(),
        },
        select: { id: true },
      });
    }
  })();

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
    select: { id: true, userId: true, familyId: true, revokedAt: true },
  });

  if (!storedToken) {
    return;
  }

  if (expectedUserId && storedToken.userId !== expectedUserId) {
    throw new AppError("Forbidden", 403);
  }

  // Revoke the full active chain for this session family so logout still works
  // when the client submits a rotated (already revoked) refresh token.
  await prisma.refreshToken.updateMany({
    where: {
      familyId: storedToken.familyId,
      revokedAt: null,
    },
    data: { revokedAt: new Date(), revokedReason: reason },
  });

  await prisma.userModel.update({
    where: { id: storedToken.userId },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  });

  await createSecurityEventSafely({
    context: "single-session logout",
    data: {
      userId: storedToken.userId,
      type: SecurityEventType.REFRESH_TOKEN_REVOKED,
      metadata: {
        reason,
      },
    },
  });
};

export const revokeAllSessionsForUser = async (
  userId: string,
  reason = "USER_LOGOUT_ALL",
) => {
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

  await createSecurityEventSafely({
    context: "logout all sessions",
    data: {
      userId,
      type: SecurityEventType.REFRESH_TOKEN_REVOKED,
      metadata: {
        reason,
        scope: "ALL_SESSIONS",
      },
    },
  });
};

export const revokeSessionById = async ({
  sessionId,
  userId,
  reason = "USER_REVOKED_SESSION",
}: {
  sessionId: string;
  userId: string;
  reason?: string;
}) => {
  const session = await prisma.refreshToken.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, revokedAt: true },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (!session.revokedAt) {
    const revokedSessionId = session.id;
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          revokedReason: reason,
        },
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

    emitForcedLogoutToSessions([revokedSessionId], reason);
  }
};

export const revokeOtherSessionsForUser = async ({
  userId,
  currentRefreshTokenHash,
  reason = "USER_LOGOUT_OTHERS",
}: {
  userId: string;
  currentRefreshTokenHash: string;
  reason?: string;
}) => {
  const sessionsToRevoke = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      tokenHash: { not: currentRefreshTokenHash },
    },
    select: { id: true },
  });

  const sessionIdsToRevoke = sessionsToRevoke.map((session) => session.id);
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
      tokenHash: { not: currentRefreshTokenHash },
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  if (result.count > 0) {
    await prisma.userModel.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
    emitForcedLogoutToSessions(sessionIdsToRevoke, reason);
  }
};

export const listUserSessions = async (userId: string) => {
  try {
    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
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
        deviceName: true,
        deviceType: true,
        platform: true,
        browser: true,
        locationLabel: true,
        appVersion: true,
        loginMethod: true,
        lastUsedAt: true,
      },
      take: 50,
    });

    return sessions;
  } catch (error) {
    if (!isMissingSessionMetadataColumnError(error)) {
      throw error;
    }

    // Backward compatibility if migration has not been applied yet.
    const legacySessions = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
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
      take: 50,
    });

    return legacySessions.map((session) => ({
      ...session,
      deviceName: null,
      deviceType: "UNKNOWN",
      platform: null,
      browser: null,
      locationLabel: null,
      appVersion: null,
      loginMethod: "EMAIL_PASSWORD",
    }));
  }
};
