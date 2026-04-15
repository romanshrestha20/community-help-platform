import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import { accessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import {
  normalizeIncomingLocation,
  toLocationCreateInput,
} from "../utils/location.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  refreshTokenBodySchema,
  registerUserBodySchema,
  resetPasswordBodySchema,
} from "../utils/validation-schemas.js";
import { normalizePhoneNumber } from "../utils/phone.js";
import { assertRateLimit } from "../services/auth-rate-limit.service.js";
import {
  createPasswordResetToken,
  findActivePasswordResetTokenByRawToken,
} from "../services/auth-token.service.js";
import { sendPasswordResetEmail } from "../services/email.service.js";

const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for this email, we sent a password reset link.";

const getRequestIp = (req: Request) => {
  return (
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown"
  ).toString();
};


export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const location = normalizeIncomingLocation(req.body as Record<string, unknown>);
  const parsedBody = registerUserBodySchema.safeParse(req.body);

  try {
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { email, password, phone, fullName, gender, dateOfBirth } = parsedBody.data;

    if (!location) {
      return next(new AppError("A valid location is required", 400));
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone) {
      return next(new AppError("Please enter a valid phone number", 400));
    }

    const parsedDateOfBirth = new Date(dateOfBirth);

    if (Number.isNaN(parsedDateOfBirth.getTime())) {
      return next(new AppError("Invalid dateOfBirth format. Use YYYY-MM-DD", 400));
    }

    const existingUser = await prisma.userModel.findFirst({
      where: {
        OR: [{ email }, { phone: normalizedPhone }],
      },
    });

    if (existingUser) {
      return next(new AppError("Email or phone already registered", 400));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.userModel.create({
      data: {
        email,
        passwordHash,
        phone: normalizedPhone,
        profile: {
          create: {
            fullName,
            gender,
            dateOfBirth: parsedDateOfBirth,
            address: {
              create: toLocationCreateInput(location),
            },
          },
        },
      },
    });

    const publicUser = await prisma.userModel.findUnique({
      where: { id: createdUser.id },
      select: {
        id: true,
        email: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            bio: true,
            dateOfBirth: true,
            gender: true,
            userType: true,
            rating: true,
            helpCount: true,
            totalReviews: true,
            avatarUrl: true,
            avatarPublicId: true,
            searchRadiusMeters: true,
            addressId: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const token = accessToken({ userId: createdUser.id });
    const refreshToken = signRefreshToken({ userId: createdUser.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { userId: createdUser.id, token: refreshToken, expiresAt },
    });

    res.status(201).json({
      success: true,
      accessToken: token,
      refreshToken,
      data: publicUser,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    const prismaCode = (error as { code?: string })?.code;

    if (prismaCode === "P2002") {
      return next(new AppError("Email or phone already registered", 400));
    }

    if (error instanceof RangeError) {
      return next(new AppError("Invalid date value provided", 400));
    }

    next(new AppError("Failed to register user", 500));
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = forgotPasswordBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { email } = parsedBody.data;
    const ipAddress = getRequestIp(req);

    assertRateLimit({
      bucket: "forgot-password:ip",
      key: ipAddress,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset requests. Please try again later.",
    });
    assertRateLimit({
      bucket: "forgot-password:email",
      key: email,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset requests. Please try again later.",
    });

    const user = await prisma.userModel.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      try {
        const { rawToken, expiresAt } = await createPasswordResetToken(user.id);

        await sendPasswordResetEmail({
          email: user.email,
          token: rawToken,
          expiresAt,
        });
      } catch (error) {
        console.error("Failed to create or send password reset email:", error);
      }
    }

    res.status(200).json({
      success: true,
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
    });
  } catch (error) {
    next(error);
  }
};


export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = loginBodySchema.safeParse(req.body);
    if (!parsedBody.success) return next(new AppError(getZodErrorMessage(parsedBody.error), 400));

    const { email, password } = parsedBody.data;

    // Find user by email for password check
    const user = await prisma.userModel.findUnique({ where: { email } });
    if (!user) {
      const deletedAccount = await prisma.deletedAccount.findUnique({
        where: { email },
      });

      if (deletedAccount) {
        return next(
          new AppError(
            "This account was deleted. Please register again if you want to continue.",
            410
          )
        );
      }

      return next(new AppError("Invalid email or password", 401));
    }

    if (!user.passwordHash) {
      return next(new AppError("Account is missing a password", 500));
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return next(new AppError("Invalid email or password", 401));

    // Return a public user payload (without passwordHash) aligned with mobile contract
    const publicUser = await prisma.userModel.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        isVerified: true,
        profile: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            bio: true,
            dateOfBirth: true,
            gender: true,
            userType: true,
            rating: true,
            helpCount: true,
            totalReviews: true,
            avatarUrl: true,
            addressId: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          } as any,
        },
      },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
    const access = accessToken({ userId: user.id });
    const refresh = signRefreshToken({ userId: user.id });

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refresh, expiresAt },
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: publicUser,
      accessToken: access,
      refreshToken: refresh,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = resetPasswordBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { token, newPassword } = parsedBody.data;
    const ipAddress = getRequestIp(req);

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters", 400));
    }

    assertRateLimit({
      bucket: "reset-password:ip",
      key: ipAddress,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset attempts. Please try again later.",
    });
    assertRateLimit({
      bucket: "reset-password:token",
      key: token,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset attempts. Please request a new reset link.",
    });

    const resetToken = await findActivePasswordResetTokenByRawToken(token);

    if (!resetToken) {
      return next(new AppError("Reset link is invalid or has expired", 400));
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const usedAt = new Date();

    await prisma.$transaction([
      prisma.userModel.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: {
            not: resetToken.id,
          },
        },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};



export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const parsedBody = changePasswordBodySchema.safeParse(req.body);

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { currentPassword, newPassword } = parsedBody.data;

    if (currentPassword === newPassword) {
      return next(new AppError("New password must be different", 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters", 400));
    }

    // Fetch the user
    const user = await prisma.userModel.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.passwordHash) {
      return next(new AppError("Account is missing a password", 500));
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await prisma.$transaction([
      prisma.userModel.update({
        where: { id: userId },
        data: { passwordHash: newHashedPassword },
      }),
      prisma.refreshToken.deleteMany({ where: { userId } }), // Invalidate all refresh tokens on password change  
    ]);

    res.status(200).json({
      status: "success",
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    next(error);
  }
};



export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = refreshTokenBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }
    const { refreshToken } = parsedBody.data;
    const decoded = verifyRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!storedToken) {
      return next(new AppError("Invalid refresh token", 401));
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return next(new AppError("Session expired. Please login again.", 401));
    }

    const newRefreshToken = signRefreshToken({ userId: decoded.userId });

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const newAccessToken = accessToken({ userId: decoded.userId });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }
  catch (error) {
    console.error("Error in refreshAccessToken:", error);
    return next(new AppError("Failed to refresh access token", 500));
  }
}
