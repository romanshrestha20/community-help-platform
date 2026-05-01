import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";
import { getRedisClient } from "../lib/redis.js";
import { SecurityEventType } from "../../generated/prisma/client.js";

const normalize = (value: string) => value.trim().toLowerCase();

const LOGIN_FAIL_WINDOW_SECONDS = 15 * 60;
const LOGIN_FAIL_LOCK_THRESHOLDS = [
  { attempts: 5, lockSeconds: 60 },
  { attempts: 10, lockSeconds: 5 * 60 },
  { attempts: 20, lockSeconds: 30 * 60 },
];

const getIpFailKey = (ip: string) => `auth:login:fail:ip:${normalize(ip)}`;
const getEmailFailKey = (email: string) => `auth:login:fail:email:${normalize(email)}`;
const getIpLockKey = (ip: string) => `auth:login:lock:ip:${normalize(ip)}`;
const getEmailLockKey = (email: string) => `auth:login:lock:email:${normalize(email)}`;
const getLastLoginIpKey = (userId: string) => `auth:last-login-ip:${userId}`;

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
      throw new AppError("Security controls unavailable.", 503);
    }

    const [ipLocked, emailLocked] = await Promise.all([
      redis.ttl(getIpLockKey(ipAddress)),
      redis.ttl(getEmailLockKey(email)),
    ]);

    if (ipLocked > 0 || emailLocked > 0) {
      throw new AppError("Too many login attempts. Please try again later.", 429);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Security controls unavailable.", 503);
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
      throw new AppError("Security controls unavailable.", 503);
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
      resolveLockDurationSeconds(emailAttempts)
    );

    if (lockDurationSeconds > 0) {
      await Promise.all([
        redis.set(getIpLockKey(ipAddress), "1", { EX: lockDurationSeconds }),
        redis.set(getEmailLockKey(email), "1", { EX: lockDurationSeconds }),
      ]);
    }

    await prisma.securityEvent.create({
      data: {
        userId: userId ?? null,
        type: lockDurationSeconds > 0 ? SecurityEventType.LOGIN_LOCKOUT : SecurityEventType.LOGIN_FAILURE,
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
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Security controls unavailable.", 503);
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
  try {
    const redis = await getRedisClient();
    if (!redis) {
      throw new AppError("Security controls unavailable.", 503);
    }

    await Promise.all([
      redis.del(getIpFailKey(ipAddress)),
      redis.del(getEmailFailKey(email)),
      redis.del(getIpLockKey(ipAddress)),
      redis.del(getEmailLockKey(email)),
    ]);

    const lastLoginIpKey = getLastLoginIpKey(userId);
    const previousIp = await redis.get(lastLoginIpKey);
    await redis.set(lastLoginIpKey, ipAddress, { EX: 60 * 60 * 24 * 30 });

    if (previousIp && previousIp !== ipAddress) {
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
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Security controls unavailable.", 503);
  }
};
