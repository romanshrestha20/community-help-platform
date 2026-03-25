import { prisma } from "../lib/prisma.js";
import {NextFunction, Request, Response} from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";


export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
const userId = req.user?.userId;

try {
    if (!userId) {
        return next(new AppError("Unauthorized", 401));
    }

    const user = await prisma.userModel.findUnique({
        where: { id: userId },
        include: { profile: true }
    });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    res.json({
        userId: user.id,
        email: user.email,
        phone: user.phone,
        profile: user.profile
    });
}
    catch (error) {
        next(error);
    }


}


export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { fullName, bio, address, dateOfBirth, gender } = req.body;

  try {
    // Ensure the user is authenticated
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    // Convert gender string to Prisma enum
    let prismaGender: string | undefined;
    if (gender === "MALE") prismaGender = "MALE";
    else if (gender === "FEMALE") prismaGender = "FEMALE";
    else if (gender === "OTHER") prismaGender = "OTHER";

    // Build update & create objects dynamically to avoid undefined
    const updateData: any = {};
    const createData: any = { userId };

    if (fullName) {
      updateData.fullName = fullName;
      createData.fullName = fullName;
    }
    if (bio) {
      updateData.bio = bio;
      createData.bio = bio;
    }
    if (address) {
      updateData.address = address;
      createData.address = address;
    }
    if (dateOfBirth) {
      updateData.dateOfBirth = new Date(dateOfBirth);
      createData.dateOfBirth = new Date(dateOfBirth);
    }
    if (prismaGender) {
      updateData.gender = prismaGender;
      createData.gender = prismaGender;
    }

    // Add timestamps
    updateData.updatedAt = new Date();
    createData.createdAt = new Date();

    // Upsert profile safely
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    });

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error(error); // Always log real error for debugging
    next(error);
  }
};

export const deleteUserAccount = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    try {
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        await prisma.userModel.delete({ where: { id: userId } });

        res.json({
            message: "User account deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
