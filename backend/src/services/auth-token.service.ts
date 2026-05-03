import { prisma } from "../lib/prisma.js";
import {
  expiresFromNow,
  generateNumericOtp,
  generateSecureToken,
  hashToken,
} from "../utils/token.js";

const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30
);
const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = Number(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS || 2
);
const PHONE_VERIFICATION_CODE_TTL_MINUTES = Number(
  process.env.PHONE_VERIFICATION_CODE_TTL_MINUTES || 10
);

export const createPasswordResetToken = async (userId: string) => {
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      usedAt: null,
    },
  });

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = expiresFromNow({ minutes: PASSWORD_RESET_TOKEN_TTL_MINUTES });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
};

export const findActivePasswordResetTokenByRawToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);

  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
};

export const createEmailVerificationToken = async (userId: string) => {
  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
      usedAt: null,
    },
  });

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = expiresFromNow({ hours: EMAIL_VERIFICATION_TOKEN_TTL_HOURS });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
};

export const findActiveEmailVerificationTokenByRawToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);

  return prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
};

export const createPhoneVerificationCode = async ({
  userId,
  phone,
}: {
  userId: string;
  phone: string;
}) => {
  await prisma.phoneVerificationCode.deleteMany({
    where: {
      userId,
      phone,
      usedAt: null,
    },
  });

  const rawCode = generateNumericOtp();
  const codeHash = hashToken(rawCode);
  const expiresAt = expiresFromNow({ minutes: PHONE_VERIFICATION_CODE_TTL_MINUTES });

  await prisma.phoneVerificationCode.create({
    data: {
      userId,
      phone,
      codeHash,
      expiresAt,
    },
  });

  return {
    rawCode,
    codeHash,
    expiresAt,
  };
};

export const findLatestActivePhoneVerificationCode = async ({
  userId,
  phone,
}: {
  userId: string;
  phone: string;
}) => {
  return prisma.phoneVerificationCode.findFirst({
    where: {
      userId,
      phone,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
