import { NextFunction, Request, Response } from "express";
import { CertificationStatus } from "../../generated/prisma/enums.js";
import AppError from "../utils/appError.js";
import { prisma } from "../lib/prisma.js";
import {
  certificationIdParamSchema,
  createUserCertificationBodySchema,
  reviewUserCertificationBodySchema,
  updateProfileSkillsBodySchema,
} from "../utils/validation-schemas.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
  ownerProfileQualificationInclude,
  serializeProfileQualifications,
} from "../utils/profile-qualifications.js";
import { buildVerificationBadges } from "../utils/verification-badges.js";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "../utils/cloudinary.js";

const MAX_PRIMARY_SKILLS = 3;

const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const parseOptionalDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("Invalid date format. Use YYYY-MM-DD.", 400);
  }

  return parsed;
};

const getOwnerProfilePayload = async (userId: string) => {
  const user = await prisma.userModel.findUnique({
    where: { id: userId },
    select: {
      isPhoneVerified: true,
      profile: {
        include: {
          address: true,
          ...ownerProfileQualificationInclude(),
        },
      },
    },
  });

  if (!user?.profile) {
    throw new AppError("Profile not found", 404);
  }

  return {
    profile: serializeProfileQualifications(user.profile),
    verificationBadges: buildVerificationBadges({
      user,
      profile: user.profile,
    }),
  };
};

export const listSkills = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await prisma.skill.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      data: skills,
      message: "Skills retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const replaceUserSkills = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsed = updateProfileSkillsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(getZodErrorMessage(parsed.error), 400));
    }

    const skills = parsed.data.skills;
    const primaryCount = skills.filter((skill) => skill.isPrimary).length;

    if (primaryCount > MAX_PRIMARY_SKILLS) {
      return next(new AppError(`You can set up to ${MAX_PRIMARY_SKILLS} primary skills.`, 400));
    }

    const uniqueSkillIds = new Set(skills.map((skill) => skill.skillId));
    if (uniqueSkillIds.size !== skills.length) {
      return next(new AppError("Duplicate skills are not allowed.", 400));
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return next(new AppError("Profile not found", 404));
    }

    if (skills.length > 0) {
      const availableSkills = await prisma.skill.findMany({
        where: {
          id: { in: skills.map((skill) => skill.skillId) },
          isActive: true,
        },
        select: { id: true },
      });

      if (availableSkills.length !== skills.length) {
        return next(new AppError("Only active skills can be selected.", 400));
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userSkill.deleteMany({
        where: { userId },
      });

      if (skills.length > 0) {
        await tx.userSkill.createMany({
          data: skills.map((skill) => ({
            userId,
            profileId: profile.id,
            skillId: skill.skillId,
            experienceLevel: skill.experienceLevel,
            yearsExperience: skill.yearsExperience ?? null,
            isPrimary: skill.isPrimary ?? false,
          })),
        });
      }
    });

    const nextPayload = await getOwnerProfilePayload(userId);

    res.status(200).json({
      status: "success",
      message: "Skills updated successfully",
      verificationBadges: nextPayload.verificationBadges,
      profile: nextPayload.profile,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadUserCertification = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!req.file) {
      return next(new AppError("Certification proof image is required.", 400));
    }

    const parsed = createUserCertificationBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(getZodErrorMessage(parsed.error), 400));
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return next(new AppError("Profile not found", 404));
    }

    const issuedAt = parseOptionalDate(parsed.data.issuedAt);
    const expiresAt = parseOptionalDate(parsed.data.expiresAt);

    if (issuedAt && expiresAt && expiresAt < issuedAt) {
      return next(new AppError("Expiration date must be after the issue date.", 400));
    }

    const uploadedProof = await uploadImageToCloudinary(
      req.file.buffer,
      `thesis-app/users/${userId}/certifications`
    );

    await prisma.userCertification.create({
      data: {
        userId,
        profileId: profile.id,
        name: parsed.data.name,
        issuer: parsed.data.issuer,
        credentialId: parsed.data.credentialId ?? null,
        proofUrl: uploadedProof.url,
        proofPublicId: uploadedProof.publicId,
        status: CertificationStatus.PENDING,
        issuedAt,
        expiresAt,
      },
    });

    const nextPayload = await getOwnerProfilePayload(userId);

    res.status(201).json({
      status: "success",
      message: "Certification uploaded successfully",
      verificationBadges: nextPayload.verificationBadges,
      profile: nextPayload.profile,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserCertification = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsedParams = certificationIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
    }

    const certification = await prisma.userCertification.findUnique({
      where: { id: parsedParams.data.id },
      select: {
        id: true,
        userId: true,
        proofPublicId: true,
      },
    });

    if (!certification || certification.userId !== userId) {
      return next(new AppError("Certification not found", 404));
    }

    await prisma.userCertification.delete({
      where: { id: certification.id },
    });

    if (certification.proofPublicId) {
      await deleteImageFromCloudinary(certification.proofPublicId).catch(() => undefined);
    }

    const nextPayload = await getOwnerProfilePayload(userId);

    res.status(200).json({
      status: "success",
      message: "Certification deleted successfully",
      verificationBadges: nextPayload.verificationBadges,
      profile: nextPayload.profile,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewUserCertification = async (req: Request, res: Response, next: NextFunction) => {
  const reviewerId = req.user?.userId;

  try {
    if (!reviewerId) {
      return next(new AppError("Unauthorized", 401));
    }

    const reviewer = await prisma.userModel.findUnique({
      where: { id: reviewerId },
      select: { email: true },
    });

    const adminEmails = getAdminEmails();
    if (!reviewer?.email || !adminEmails.includes(reviewer.email.toLowerCase())) {
      return next(new AppError("Admin access required", 403));
    }

    const parsedParams = certificationIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
    }

    const parsedBody = reviewUserCertificationBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const existing = await prisma.userCertification.findUnique({
      where: { id: parsedParams.data.id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!existing) {
      return next(new AppError("Certification not found", 404));
    }

    if (existing.userId === reviewerId) {
      return next(new AppError("You cannot review your own certification.", 403));
    }

    const certification = await prisma.userCertification.update({
      where: { id: existing.id },
      data: {
        status: parsedBody.data.status,
        reviewNote: parsedBody.data.reviewNote ?? null,
        rejectionReason:
          parsedBody.data.status === "REJECTED"
            ? parsedBody.data.rejectionReason ?? null
            : null,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });

    res.status(200).json({
      success: true,
      data: certification,
      message: "Certification reviewed successfully",
    });
  } catch (error) {
    next(error);
  }
};
