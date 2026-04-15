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
  loginBodySchema,
  refreshTokenBodySchema,
  registerUserBodySchema,
} from "../utils/validation-schemas.js";


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

    const parsedDateOfBirth = new Date(dateOfBirth);

    if (Number.isNaN(parsedDateOfBirth.getTime())) {
      return next(new AppError("Invalid dateOfBirth format. Use YYYY-MM-DD", 400));
    }

    const existingUser = await prisma.userModel.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return next(new AppError("Email or phone already registered", 400));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.userModel.create({
      data: {
        email,
        passwordHash,
        phone,
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
      include: {
        profile: {
          include: {
            address: true,
          },
        },
      },
    });

    const token = accessToken({ userId: newUser.id });
    const refreshToken = signRefreshToken({ userId: newUser.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { userId: newUser.id, token: refreshToken, expiresAt },
    });

    res.status(201).json({
      success: true,
      accessToken: token,
      refreshToken,
      data: newUser,
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
