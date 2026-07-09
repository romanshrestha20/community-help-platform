import { describe, expect, it } from "vitest";

import { CertificationStatus } from "../../../generated/prisma/enums.js";
import { buildVerificationBadges } from "../verification-badges.js";

describe("verification-badges", () => {
  it("builds phone and email verification badges independently", () => {
    expect(
      buildVerificationBadges({
        user: {
          isPhoneVerified: true,
          isEmailVerified: true,
        },
      })
    ).toEqual([
      {
        key: "PHONE_VERIFIED",
        label: "Phone Verified",
        level: "basic",
      },
      {
        key: "EMAIL_VERIFIED",
        label: "Email Verified",
        level: "basic",
      },
    ]);
  });

  it("awards top-rated helper only when all trust thresholds are met", () => {
    expect(
      buildVerificationBadges({
        user: { isPhoneVerified: true },
        profile: {
          helpCount: 5,
          rating: 4.5,
          totalReviews: 3,
        },
      }).some((badge) => badge.key === "TOP_RATED_HELPER")
    ).toBe(false);

    expect(
      buildVerificationBadges({
        user: { isPhoneVerified: true },
        profile: {
          helpCount: 5,
          rating: 4.6,
          totalReviews: 3,
        },
      }).some((badge) => badge.key === "TOP_RATED_HELPER")
    ).toBe(true);
  });

  it("adds ID verification when an approved certification exists", () => {
    expect(
      buildVerificationBadges({
        profile: {
          certifications: [
            { status: CertificationStatus.PENDING },
            { status: CertificationStatus.APPROVED },
          ],
        },
      })
    ).toContainEqual({
      key: "ID_VERIFIED",
      label: "ID Verified",
      level: "qualification",
    });
  });
});
