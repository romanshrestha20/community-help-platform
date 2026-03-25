import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import { accessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";


export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, phone, fullName, gender, dateOfBirth, city, country, street, state, latitude, longitude, radius } = req.body;

  try {
    // Validate required fields
    if (!email || !password || !phone || !fullName || !gender || !dateOfBirth) {
      return next(new AppError("Missing required fields", 400));
    }

    // latitude & longitude are required for address
    if (latitude === undefined || longitude === undefined) {
      return next(new AppError("Latitude and longitude are required for address", 400));
    }

    // Check if user already exists
    const existingUser = await prisma.userModel.findUnique({ where: { email } });
    if (existingUser) return next(new AppError("Email already registered", 400));

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);


    // Create user with profile and nested address
    const newUser = await prisma.userModel.create({
      data: {
        email,
        passwordHash,
        phone,
        profile: {
          create: {
            fullName,
            gender,
            dateOfBirth: new Date(dateOfBirth),
            address: {
              create: {
                latitude,
                longitude,
                radius: radius || 800,
                city: city || null,
                country: country || null,
                street: street || null,
                state: state || null,
              },
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

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
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
    next(new AppError("Failed to register user", 500));
  }
};


export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError("Email and password are required", 400));

    // Find user by email for password check
    const user = await prisma.userModel.findUnique({ where: { email } });
    if (!user) return next(new AppError("Invalid email or password", 401));

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
            addressId: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
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
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }



    if (!currentPassword || !newPassword) {
      return next(new AppError("Current and new passwords are required", 400));
    }

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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }
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