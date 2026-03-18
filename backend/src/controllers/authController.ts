import {prisma} from "../lib/prisma.js";
import {NextFunction, Request, Response} from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import { accessToken, verifyAccessToken } from "../utils/jwt.js";



 export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, password, phone, address } = req.body;

  try {
    if (!fullName || !email || !password || !phone || !address) {
      return next(new AppError("All fields are required", 400));
    }

    // Check if email or phone already exists
    const existingUser = await prisma.userModel.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return next(new AppError("Email or phone already in use", 400));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user + profile
    const newUser = await prisma.userModel.create({
      data: {
        email,
        passwordHash,
        phone,
        profile: {
            create: { 
              fullName,
              address
             },
        },
      },
      include: { profile: true },
    });

    // Generate JWT
    const token = accessToken({ userId: newUser.id });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.id,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    // Find user by email
    const user = await prisma.userModel.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Generate JWT
    const token = accessToken({ userId: user.id });

    res.status(200).json({
      message: "Login successful",
      userId: user.id,
      token,
    });
  } catch (error) {
    next(error);
  }
};


