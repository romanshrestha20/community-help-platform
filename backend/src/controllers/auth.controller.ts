import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import { accessToken } from "../utils/jwt.js";

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password, phone, address, gender, dateOfBirth } = req.body;

    if (!fullName || !email || !password || !phone || !address || !gender || !dateOfBirth) {
      return next(new AppError("All fields are required", 400));
    }

    // Validate gender
    const validGenders = ["MALE", "FEMALE", "OTHER"];
    if (!validGenders.includes(gender)) return next(new AppError("Invalid gender value", 400));

    // Validate date
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return next(new AppError("Invalid date of birth", 400));

    // Check if email/phone exists
    const existingUser = await prisma.userModel.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) return next(new AppError("Email or phone already in use", 400));

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user + profile
    const newUser = await prisma.userModel.create({
      data: {
        email,
        passwordHash,
        phone,
        profile: {
          create: { fullName, address, gender, dateOfBirth: dob },
        },
      },
      include: { profile: true },
    });

    // Generate JWT
    const token = accessToken({ userId: newUser.id });

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      userId: newUser.id,
      token,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    next(error);
  }
};
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError("Email and password are required", 400));

    // Find user by email
    const user = await prisma.userModel.findUnique({ where: { email } });
    if (!user) return next(new AppError("Invalid email or password", 401));

    // Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return next(new AppError("Invalid email or password", 401));

    // Generate JWT
    const token = accessToken({ userId: user.id });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      userId: user.id,
      token,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    next(error);
  }
};