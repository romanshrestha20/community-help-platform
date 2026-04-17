import { prisma } from "../lib/prisma.js";

export interface OAuthUser {
    provider: "GOOGLE";
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
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
    const fullName = buildFullName(oauthUser);

    if (!user) {
        user = await prisma.userModel.create({
            data: {
                email: oauthUser.email,
                isEmailVerified: true,
                profile: {
                    create: {
                        fullName,
                        avatarUrl: oauthUser.avatarUrl ?? null,
                    },
                },
            },
        });
    } else {
        const existingProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                id: true,
            },
        });

        if (!existingProfile) {
            await prisma.profile.create({
                data: {
                    userId: user.id,
                    fullName,
                    avatarUrl: oauthUser.avatarUrl ?? null,
                },
            });
        } else if (oauthUser.avatarUrl) {
            await prisma.profile.update({
                where: { userId: user.id },
                data: {
                    avatarUrl: oauthUser.avatarUrl,
                },
            });
        }

        user = await prisma.userModel.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
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
