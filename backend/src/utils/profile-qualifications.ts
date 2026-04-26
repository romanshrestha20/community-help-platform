import { Prisma } from "../../generated/prisma/client.js";
import { CertificationStatus } from "../../generated/prisma/enums.js";

export const ownerProfileQualificationInclude = (): Prisma.ProfileInclude => ({
  userSkills: {
    orderBy: [{ isPrimary: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.asc }],
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          isActive: true,
        },
      },
    },
  },
  certifications: {
    orderBy: [{ createdAt: Prisma.SortOrder.desc }],
    select: {
      id: true,
      userId: true,
      profileId: true,
      name: true,
      issuer: true,
      credentialId: true,
      proofUrl: true,
      proofPublicId: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      reviewNote: true,
      rejectionReason: true,
      reviewedAt: true,
      reviewedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  },
});

export const publicProfileQualificationInclude = (): Prisma.ProfileInclude => ({
  userSkills: {
    orderBy: [{ isPrimary: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.asc }],
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          isActive: true,
        },
      },
    },
  },
  certifications: {
    where: {
      status: CertificationStatus.APPROVED,
    },
    orderBy: [
      { reviewedAt: Prisma.SortOrder.desc },
      { createdAt: Prisma.SortOrder.desc },
    ],
    select: {
      id: true,
      name: true,
      issuer: true,
      credentialId: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
});

const serializeSkill = (userSkill: any) => ({
  id: userSkill.id,
  skillId: userSkill.skillId,
  experienceLevel: userSkill.experienceLevel,
  yearsExperience: userSkill.yearsExperience ?? null,
  isPrimary: userSkill.isPrimary,
  createdAt: userSkill.createdAt,
  updatedAt: userSkill.updatedAt,
  skill: userSkill.skill
    ? {
        id: userSkill.skill.id,
        name: userSkill.skill.name,
        slug: userSkill.skill.slug,
        categoryId: userSkill.skill.categoryId ?? null,
        isActive: userSkill.skill.isActive,
      }
    : null,
});

const serializeCertificationOwner = (certification: any) => ({
  id: certification.id,
  userId: certification.userId,
  profileId: certification.profileId,
  name: certification.name,
  issuer: certification.issuer,
  credentialId: certification.credentialId ?? null,
  proofUrl: certification.proofUrl,
  proofPublicId: certification.proofPublicId ?? null,
  status: certification.status,
  issuedAt: certification.issuedAt,
  expiresAt: certification.expiresAt,
  reviewNote: certification.reviewNote ?? null,
  rejectionReason: certification.rejectionReason ?? null,
  reviewedAt: certification.reviewedAt,
  reviewedBy: certification.reviewedBy ?? null,
  createdAt: certification.createdAt,
  updatedAt: certification.updatedAt,
});

const serializeCertificationPublic = (certification: any) => ({
  id: certification.id,
  name: certification.name,
  issuer: certification.issuer,
  credentialId: certification.credentialId ?? null,
  status: certification.status,
  issuedAt: certification.issuedAt,
  expiresAt: certification.expiresAt,
  reviewedAt: certification.reviewedAt,
  createdAt: certification.createdAt,
  updatedAt: certification.updatedAt,
});

export const serializeProfileQualifications = (
  profile: any,
  options?: { publicView?: boolean }
) => {
  if (!profile) {
    return profile;
  }

  const publicView = options?.publicView === true;

  return {
    ...profile,
    skills: Array.isArray(profile.userSkills) ? profile.userSkills.map(serializeSkill) : [],
    certifications: Array.isArray(profile.certifications)
      ? profile.certifications.map(
          publicView ? serializeCertificationPublic : serializeCertificationOwner
        )
      : [],
  };
};
