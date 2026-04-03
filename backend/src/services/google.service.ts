import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma.js";
import { accessToken, signRefreshToken } from "../utils/jwt.js";
import { verifyGoogleToken } from "../utils/google.util.js";

type GoogleSignInInput = {
  idToken: string;
};

type GoogleDevSignInInput = {
  email: string;
  fullName?: string;
  providerId?: string;
};

type SafeUser = {
  id: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  profile?: {
    fullName: string;
  } | null;
};

type GoogleSignInResult = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
};

export class AuthService {
  async googleSignIn({ idToken }: GoogleSignInInput): Promise<GoogleSignInResult> {
    const googleUser = await verifyGoogleToken(idToken);

    return this.findOrCreateGoogleIdentity({
      providerId: googleUser.providerId,
      email: googleUser.email,
      fullName: googleUser.fullName || googleUser.email.split("@")[0],
      isVerified: googleUser.emailVerified,
    });
  }

  async googleSignInForDevelopment({
    email,
    fullName,
    providerId,
  }: GoogleDevSignInInput): Promise<GoogleSignInResult> {
    const devProviderId = providerId || email.split("@")[0];

    return this.findOrCreateGoogleIdentity({
      providerId: devProviderId,
      email,
      fullName: fullName || email.split("@")[0],
      isVerified: true,
    });
  }

  private async findOrCreateGoogleIdentity({
    providerId,
    email,
    fullName,
    isVerified,
  }: {
    providerId: string;
    email: string;
    fullName: string;
    isVerified: boolean;
  }): Promise<GoogleSignInResult> {
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: "GOOGLE",
          providerId,
        },
      },
      include: {
        user: {
          include: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (existingOAuth) {
      const tokens = await this.issueTokens(existingOAuth.user.id);
      return {
        user: this.toSafeUser(existingOAuth.user),
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        isNewUser: false,
      };
    }

    const existingUser = await prisma.userModel.findUnique({
      where: { email },
      include: {
        profile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (existingUser) {
      const user = await prisma.$transaction(async (tx) => {
        await tx.oAuthAccount.create({
          data: {
            provider: "GOOGLE",
            providerId,
            userId: existingUser.id,
          },
        });

        if (isVerified && !existingUser.isVerified) {
          return tx.userModel.update({
            where: { id: existingUser.id },
            data: { isVerified: true },
            include: {
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          });
        }

        return existingUser;
      });

      const tokens = await this.issueTokens(user.id);
      return {
        user: this.toSafeUser(user),
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        isNewUser: false,
      };
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    const syntheticPhone = `oauth-google-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.userModel.create({
        data: {
          email,
          phone: syntheticPhone,
          passwordHash,
          isVerified,
          profile: {
            create: {
              fullName,
            },
          },
        },
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      });

      await tx.oAuthAccount.create({
        data: {
          provider: "GOOGLE",
          providerId,
          userId: user.id,
        },
      });

      return user;
    });

    const tokens = await this.issueTokens(createdUser.id);
    return {
      user: this.toSafeUser(createdUser),
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      isNewUser: true,
    };
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    phone: string | null;
    isVerified: boolean;
    profile?: {
      fullName: string;
    } | null;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      profile: user.profile,
    };
  }

  private async issueTokens(userId: string): Promise<{ access: string; refresh: string }> {
    const access = accessToken({ userId });
    const refresh = signRefreshToken({ userId });

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refresh,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { access, refresh };
  }
}