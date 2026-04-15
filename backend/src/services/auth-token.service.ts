import { prisma } from "../lib/prisma.js";
import { expiresFromNow, generateSecureToken, hashToken } from "../utils/token.js";

const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30
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
