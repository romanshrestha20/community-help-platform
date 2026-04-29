import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import {
  toLocationCreateInput,
  toLocationUpdateInput,
  normalizeIncomingLocation,
} from "../utils/location.js";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";
import { normalizePhoneNumber } from "../utils/phone.js";
import {
  ownerProfileQualificationInclude,
  serializeProfileQualifications,
} from "../utils/profile-qualifications.js";
import { buildVerificationBadges } from "../utils/verification-badges.js";

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
            ...ownerProfileQualificationInclude(),
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
      hasPassword: Boolean(user.passwordHash),
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      verificationBadges: buildVerificationBadges({
        user,
        profile: user.profile,
      }),
      profile: user.profile ? serializeProfileQualifications(user.profile) : null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { fullName, phone, bio, dateOfBirth, gender, userType } = req.body;
  const location = normalizeIncomingLocation(req.body as Record<string, unknown>);
  const hasLocationPayload = Object.prototype.hasOwnProperty.call(req.body, "location");

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (hasLocationPayload && !location) {
      return next(
        new AppError("Invalid location payload. Use location.latitude and location.longitude.", 400)
      );
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { address: true },
    });

    if (!existingProfile) {
      return next(new AppError("Profile not found", 404));
    }

    const existingUser = await prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    if (!existingUser) {
      return next(new AppError("User not found", 404));
    }

    let parsedDateOfBirth: Date | undefined;
    let normalizedPhone: string | undefined;
    if (dateOfBirth !== undefined && dateOfBirth !== null) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime())) {
        return next(new AppError("Invalid dateOfBirth format. Use YYYY-MM-DD", 400));
      }
    }

    if (phone !== undefined) {
      const parsedPhone = normalizePhoneNumber(String(phone));
      if (!parsedPhone) {
        return next(new AppError("Please enter a valid phone number", 400));
      }
      normalizedPhone = parsedPhone.toString();
    }

    const shouldResetPhoneVerification =
      normalizedPhone !== undefined && normalizedPhone !== existingUser.phone;

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

    const [updatedUser, updatedProfile] = await prisma.$transaction([
      normalizedPhone !== undefined
        ? prisma.userModel.update({
          where: { id: userId },
          data: {
            phone: normalizedPhone,
            isPhoneVerified: shouldResetPhoneVerification ? false : undefined,
            isVerified: shouldResetPhoneVerification
              ? existingUser.isEmailVerified
              : undefined,
          },
          select: {
            phone: true,
            isVerified: true,
            isEmailVerified: true,
            isPhoneVerified: true,
          },
        })
        : prisma.userModel.findUniqueOrThrow({
          where: { id: userId },
          select: {
            phone: true,
            isVerified: true,
            isEmailVerified: true,
            isPhoneVerified: true,
          },
        }),
      prisma.profile.update({
        where: { userId },
        data: updateData,
        include: {
          address: true,
          ...ownerProfileQualificationInclude(),
        },
      }),
    ]);

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      phone: updatedUser.phone,
      isVerified: updatedUser.isVerified,
      isEmailVerified: updatedUser.isEmailVerified,
      isPhoneVerified: updatedUser.isPhoneVerified,
      verificationBadges: buildVerificationBadges({
        user: updatedUser,
        profile: updatedProfile,
      }),
      profile: serializeProfileQualifications(updatedProfile),
    });
  } catch (error) {
    console.error(error);

    const prismaCode = (error as { code?: string })?.code;
    if (prismaCode === "P2002") {
      return next(new AppError("Email or phone already registered", 400));
    }

    next(error);
  }
};

export const uploadUserAvatar = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!req.file) {
      return next(new AppError("Avatar image is required", 400));
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return next(new AppError("Profile not found", 404));
    }

    const uploadedAvatar = await uploadImageToCloudinary(
      req.file.buffer,
      `thesis-app/users/${userId}/avatar`
    );

    const userFlags = await prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        isPhoneVerified: true,
      },
    });

    if (profile.avatarPublicId) {
      try {
        await deleteImageFromCloudinary(profile.avatarPublicId);
      } catch {
        // ignore Cloudinary cleanup failure so avatar update still succeeds
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        avatarUrl: uploadedAvatar.url,
        avatarPublicId: uploadedAvatar.publicId,
      },
      include: {
        address: true,
        ...ownerProfileQualificationInclude(),
      },
    });
    const { avatarPublicId, ...safeProfile } = updatedProfile;

    res.json({
      status: "success",
      message: "Avatar updated successfully",
      verificationBadges: buildVerificationBadges({
        user: userFlags,
        profile: safeProfile,
      }),
      profile: serializeProfileQualifications(safeProfile),
    });

  } catch (error) {
    next(error);
  }
};

export const deleteUserAvatar = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        address: true,
        ...ownerProfileQualificationInclude(),
      },
    });

    const userFlags = await prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        isPhoneVerified: true,
      },
    });

    if (!profile) {
      return next(new AppError("Profile not found", 404));
    }

    if (!profile.avatarUrl && !profile.avatarPublicId) {
      return next(new AppError("No avatar to delete", 400));
    }

    if (profile.avatarPublicId) {
      try {
        await deleteImageFromCloudinary(profile.avatarPublicId);
      } catch {
        // ignore Cloudinary cleanup failure so DB can still be cleaned
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        avatarUrl: null,
        avatarPublicId: null,
      },
      include: {
        address: true,
        ...ownerProfileQualificationInclude(),
      },
    });

    res.status(200).json({
      status: "success",
      message: "Avatar deleted successfully",
      verificationBadges: buildVerificationBadges({
        user: userFlags,
        profile: updatedProfile,
      }),
      profile: serializeProfileQualifications(updatedProfile),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAccount = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { password } = req.body ?? {};

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const user = await prisma.userModel.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.passwordHash) {
      if (!password || typeof password !== "string") {
        return next(new AppError("Password is required", 400));
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return next(new AppError("Incorrect password", 401));
      }
    }

    await prisma.$transaction([
      prisma.deletedAccount.upsert({
        where: { email: user.email },
        update: { deletedAt: new Date() },
        create: {
          email: user.email,
        },
      }),
      prisma.userModel.delete({
        where: { id: userId },
      }),
    ]);

    res.json({
      status: "success",
      message: "User account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
