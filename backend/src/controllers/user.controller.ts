import { prisma } from "../lib/prisma.js";
import {NextFunction, Request, Response} from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import {
  toLocationCreateInput,
  toLocationUpdateInput,
  normalizeIncomingLocation,
} from "../utils/location.js";

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const user = await prisma.userModel.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            address: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.json({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      profile: user.profile,
    });
  } catch (error) {
    next(error);
  }
};


export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { fullName, bio, dateOfBirth, gender, userType } = req.body;
  const location = normalizeIncomingLocation(req.body as Record<string, unknown>);
  const hasLocationPayload = Object.prototype.hasOwnProperty.call(req.body, "location");

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (hasLocationPayload && !location) {
      return next(new AppError("Invalid location payload. Use location.latitude and location.longitude.", 400));
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { address: true },
    });

    if (!existingProfile) {
      return next(new AppError("Profile not found", 404));
    }

    let parsedDateOfBirth: Date | undefined;
    if (dateOfBirth !== undefined && dateOfBirth !== null) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime())) {
        return next(new AppError("Invalid dateOfBirth format. Use YYYY-MM-DD", 400));
      }
    }

    const updateData: any = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (parsedDateOfBirth !== undefined) updateData.dateOfBirth = parsedDateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (userType !== undefined) updateData.userType = userType;

    if (location) {
      if (existingProfile.addressId) {
        updateData.address = {
          update: toLocationUpdateInput(location),
        };
      } else {
        updateData.address = {
          create: toLocationCreateInput(location),
        };
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData,
      include: {
        address: true,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error(error);
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
