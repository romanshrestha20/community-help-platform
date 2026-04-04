import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma.js";

export interface OAuthUser {
    provider: "GOOGLE";
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

const buildFullName = (oauthUser: OAuthUser): string => {
    const fullName = `${oauthUser.firstName ?? ""} ${oauthUser.lastName ?? ""}`.trim();
    return fullName || oauthUser.email.split("@")[0];
};

export const findOrCreateOAuthUser = async (oauthUser: OAuthUser) => {
    const oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
            provider_providerId: {
                provider: oauthUser.provider,
                providerId: oauthUser.providerId,
            },
        },
    });

    if (oauthAccount) {
        const linkedUser = await prisma.userModel.findUnique({ where: { id: oauthAccount.userId } });
        if (!linkedUser) {
            throw new Error("Linked user not found for OAuth account");
        }
        return linkedUser;
    }

    let user = await prisma.userModel.findUnique({ where: { email: oauthUser.email } });

    if (!user) {
        const passwordHash = await bcrypt.hash(randomUUID(), 10);
        const syntheticPhone = `oauth-${oauthUser.provider.toLowerCase()}-${Date.now()}-${randomUUID().slice(0, 8)}`;
        const fullName = buildFullName(oauthUser);

        user = await prisma.userModel.create({
            data: {
                email: oauthUser.email,
                phone: syntheticPhone,
                passwordHash,
                isVerified: true,
                profile: {
                    create: {
                        fullName,
                    },
                },
            },
        });
    }

    await prisma.oAuthAccount.create({
        data: {
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
            userId: user.id,
        },
    });

    return user;
};

export const linkOAuthProviderToUser = async (userId: string, oauthUser: OAuthUser) => {
    const existingOAuth = await prisma.oAuthAccount.findUnique({
        where: {
            provider_providerId: {
                provider: oauthUser.provider,
                providerId: oauthUser.providerId,
            },
        },
    });

    if (existingOAuth) {
        throw new Error("OAuth account already linked to another user");
    }

    const user = await prisma.userModel.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }

    return prisma.oAuthAccount.create({
        data: {
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
            userId,
        },
    });
};

export const removeOAuthProviderFromUser = async (
    userId: string,
    provider: "GOOGLE"
) => {
    const oauthAccount = await prisma.oAuthAccount.findFirst({
        where: { userId, provider },
    });

    if (!oauthAccount) {
        throw new Error("OAuth provider not linked");
    }

    await prisma.oAuthAccount.delete({ where: { id: oauthAccount.id } });
};