import { CertificationStatus } from "../../generated/prisma/enums.js";

export type VerificationBadgeLevel = "basic" | "trust" | "qualification";

export type VerificationBadgeKey =
  | "PHONE_VERIFIED"
  | "EMAIL_VERIFIED"
  | "TRUSTED_HELPER"
  | "CERTIFIED_HELPER";

export type VerificationBadge = {
  key: VerificationBadgeKey;
  label: string;
  level: VerificationBadgeLevel;
};

type Input = {
  user?: {
    isPhoneVerified?: boolean | null;
    isEmailVerified?: boolean | null;
  } | null;
  profile?: {
    rating?: number | null;
    helpCount?: number | null;
    totalReviews?: number | null;
    certifications?: Array<{
      status?: string | null;
    }> | null;
  } | null;
};

const TRUSTED_HELPER_MIN_HELP_COUNT = 5;
const TRUSTED_HELPER_MIN_RATING = 4.5;
const TRUSTED_HELPER_MIN_REVIEWS = 3;

export const buildVerificationBadges = ({
  user,
  profile,
}: Input): VerificationBadge[] => {
  const badges: VerificationBadge[] = [];

  if (user?.isPhoneVerified) {
    badges.push({
      key: "PHONE_VERIFIED",
      label: "Phone Verified",
      level: "basic",
    });
  }

  if (user?.isEmailVerified) {
    badges.push({
      key: "EMAIL_VERIFIED",
      label: "Email Verified",
      level: "basic",
    });
  }

  const helpCount = profile?.helpCount ?? 0;
  const rating = profile?.rating ?? 0;
  const totalReviews = profile?.totalReviews ?? 0;

  if (
    helpCount >= TRUSTED_HELPER_MIN_HELP_COUNT &&
    rating >= TRUSTED_HELPER_MIN_RATING &&
    totalReviews >= TRUSTED_HELPER_MIN_REVIEWS
  ) {
    badges.push({
      key: "TRUSTED_HELPER",
      label: "Trusted Helper",
      level: "trust",
    });
  }

  const hasApprovedCertification =
    Array.isArray(profile?.certifications) &&
    profile.certifications.some(
      (certification) => certification?.status === CertificationStatus.APPROVED
    );

  if (hasApprovedCertification) {
    badges.push({
      key: "CERTIFIED_HELPER",
      label: "Certified",
      level: "qualification",
    });
  }

  return badges;
};
