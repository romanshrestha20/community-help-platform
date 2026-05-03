import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";
import { getRedisClient } from "../lib/redis.js";
import { Prisma, SecurityEventType } from "../../generated/prisma/client.js";

const normalize = (value: string) => value.trim().toLowerCase();

const LOGIN_FAIL_WINDOW_SECONDS = 15 * 60;
const LOGIN_FAIL_LOCK_THRESHOLDS = [
  { attempts: 5, lockSeconds: 60 },
  { attempts: 10, lockSeconds: 5 * 60 },
  { attempts: 20, lockSeconds: 30 * 60 },
];

const getIpFailKey = (ip: string) => `auth:login:fail:ip:${normalize(ip)}`;
const getEmailFailKey = (email: string) =>
  `auth:login:fail:email:${normalize(email)}`;
const getIpLockKey = (ip: string) => `auth:login:lock:ip:${normalize(ip)}`;
const getEmailLockKey = (email: string) =>
  `auth:login:lock:email:${normalize(email)}`;
const getLastLoginIpKey = (userId: string) => `auth:last-login-ip:${userId}`;
const isMissingSecurityEventsTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2021";

const resolveLockDurationSeconds = (attempts: number) => {
  let selected = 0;
  for (const threshold of LOGIN_FAIL_LOCK_THRESHOLDS) {
    if (attempts >= threshold.attempts) {
      selected = threshold.lockSeconds;
    }
  }
  return selected;
};

export const assertLoginAllowed = async ({
  email,
  ipAddress,
}: {
  email: string;
  ipAddress: string;
}) => {
  try {
    const redis = await getRedisClient();
    if (!redis) {
      console.warn(
        "Security controls unavailable: Redis not connected, allowing login (fail-open mode).",
      );
      return;
    }

    const [ipLocked, emailLocked] = await Promise.all([
      redis.ttl(getIpLockKey(ipAddress)),
      redis.ttl(getEmailLockKey(email)),
    ]);

    if (ipLocked > 0 || emailLocked > 0) {
      throw new AppError(
        "Too many login attempts. Please try again later.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.warn(
      "Security controls unavailable: Redis check failed, allowing login (fail-open mode).",
      error,
    );
  }
};

export const recordFailedLoginAttempt = async ({
  email,
  ipAddress,
  userAgent,
  userId,
}: {
  email: string;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
}) => {
  try {
    const redis = await getRedisClient();
    if (!redis) {
      console.warn(
        "Security controls unavailable: Redis not connected, skipping failed-login tracking.",
      );
      return;
    }

    const ipFailKey = getIpFailKey(ipAddress);
    const emailFailKey = getEmailFailKey(email);

    const [ipAttempts, emailAttempts] = await Promise.all([
      redis.incr(ipFailKey),
      redis.incr(emailFailKey),
    ]);

    await Promise.all([
      redis.expire(ipFailKey, LOGIN_FAIL_WINDOW_SECONDS),
      redis.expire(emailFailKey, LOGIN_FAIL_WINDOW_SECONDS),
    ]);

    const lockDurationSeconds = Math.max(
      resolveLockDurationSeconds(ipAttempts),
      resolveLockDurationSeconds(emailAttempts),
    );

    if (lockDurationSeconds > 0) {
      await Promise.all([
        redis.set(getIpLockKey(ipAddress), "1", { EX: lockDurationSeconds }),
        redis.set(getEmailLockKey(email), "1", { EX: lockDurationSeconds }),
      ]);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.warn(
      "Security controls unavailable: failed-login tracking skipped.",
      error,
    );
    return;
  }

  try {
    const redis = await getRedisClient();
    if (!redis) {
      return;
    }

    const [ipAttemptsRaw, emailAttemptsRaw, ipLockTtl, emailLockTtl] =
      await Promise.all([
        redis.get(getIpFailKey(ipAddress)),
        redis.get(getEmailFailKey(email)),
        redis.ttl(getIpLockKey(ipAddress)),
        redis.ttl(getEmailLockKey(email)),
      ]);

    const ipAttempts = Number(ipAttemptsRaw ?? 0);
    const emailAttempts = Number(emailAttemptsRaw ?? 0);
    const lockDurationSeconds = Math.max(ipLockTtl, emailLockTtl, 0);

    await prisma.securityEvent.create({
      data: {
        userId: userId ?? null,
        type:
          lockDurationSeconds > 0
            ? SecurityEventType.LOGIN_LOCKOUT
            : SecurityEventType.LOGIN_FAILURE,
        ipAddress,
        userAgent: userAgent ?? null,
        metadata: {
          email: normalize(email),
          ipAttempts,
          emailAttempts,
          lockDurationSeconds,
        },
      },
    });
  } catch (error) {
    if (isMissingSecurityEventsTableError(error)) {
      console.warn(
        "Security audit table unavailable; skipping failed-login event persistence.",
      );
      return;
    }
    console.error("Failed to persist failed login security event:", error);
  }
};

export const recordSuccessfulLogin = async ({
  userId,
  email,
  ipAddress,
  userAgent,
}: {
  userId: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
}) => {
  let previousIp: string | null = null;
  let suspiciousLoginDetected = false;

  try {
    const redis = await getRedisClient();
    if (!redis) {
      console.warn(
        "Security controls unavailable: Redis not connected, skipping successful-login tracking.",
      );
      return;
    }

    await Promise.all([
      redis.del(getIpFailKey(ipAddress)),
      redis.del(getEmailFailKey(email)),
      redis.del(getIpLockKey(ipAddress)),
      redis.del(getEmailLockKey(email)),
    ]);

    const lastLoginIpKey = getLastLoginIpKey(userId);
    previousIp = await redis.get(lastLoginIpKey);
    await redis.set(lastLoginIpKey, ipAddress, { EX: 60 * 60 * 24 * 30 });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.warn(
      "Security controls unavailable: successful-login tracking skipped.",
      error,
    );
    return;
  }

  try {
    if (previousIp && previousIp !== ipAddress) {
      suspiciousLoginDetected = true;
      await prisma.securityEvent.create({
        data: {
          userId,
          type: SecurityEventType.SUSPICIOUS_LOGIN,
          ipAddress,
          userAgent: userAgent ?? null,
          metadata: {
            previousIp,
            newIp: ipAddress,
            reason: "IP_CHANGED",
          },
        },
      });
    }

    await prisma.securityEvent.create({
      data: {
        userId,
        type: SecurityEventType.LOGIN_SUCCESS,
        ipAddress,
        userAgent: userAgent ?? null,
        metadata: {
          email: normalize(email),
        },
      },
    });
  } catch (error) {
    if (isMissingSecurityEventsTableError(error)) {
      console.warn(
        "Security audit table unavailable; skipping successful-login event persistence.",
      );
      return;
    }
    console.error("Failed to persist successful login security event:", error);
  }

  return {
    suspiciousLoginDetected,
    previousIp,
  };
};
