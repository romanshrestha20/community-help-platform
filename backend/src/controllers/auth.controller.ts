import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import { accessToken } from "../utils/jwt.js";


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
    
    res.status(201).json({
      success: true,
      token,
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

    const token = accessToken({ userId: user.id });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: publicUser,
      token,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    next(error);
  }
};