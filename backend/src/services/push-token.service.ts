import { prisma } from "../lib/prisma.js";

export type UpsertPushTokenInput = {
    userId: string;
    token: string;
    platform?: string | null;
};

export const upsertPushTokenForUser = async ({ userId, token, platform }: UpsertPushTokenInput) => {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
        throw new Error("Push token is required");
    }

    return prisma.pushToken.upsert({
        where: { token: normalizedToken },
        create: {
            userId,
            token: normalizedToken,
            platform: platform ?? null,
        },
        update: {
            userId,
            platform: platform ?? null,
        },
    });
};

export const getPushTokensForUser = async (userId: string) => {
    return prisma.pushToken.findMany({
        where: { userId },
        select: { token: true },
    });
};

export const deletePushTokenForUser = async (userId: string, token: string) => {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
        throw new Error("Push token is required");
    }

    return prisma.pushToken.deleteMany({
        where: {
            userId,
            token: normalizedToken,
        },
    });
};