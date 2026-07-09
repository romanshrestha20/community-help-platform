import { describe, expect, it } from "vitest";

import { UserType, type GetUserProfileApiResponse, type UpdateUserProfileApiResponse, type UserProfile } from "../types/user.types";

import {
  mapGetProfileResponseToUser,
  mapProfileMutationResponseToUser,
  mapProfileToUser,
} from "./user.mapper";

const profile: UserProfile = {
  id: "profile-1",
  userId: "user-1",
  fullName: "Roman Shrestha",
  bio: "Helpful neighbor",
  dateOfBirth: "1990-05-20T00:00:00.000Z",
  gender: null,
  userType: UserType.GENERAL,
  rating: 4.8,
  helpCount: 12,
  avatarUrl: null,
  searchRadiusMeters: 5000,
  address: {
    latitude: 60.17,
    longitude: 24.93,
    city: "Helsinki",
    country: "Finland",
  },
  skills: [],
  certifications: [],
  createdAt: "2026-06-20T10:00:00.000Z",
  updatedAt: "2026-06-20T10:00:00.000Z",
};

describe("user.mapper", () => {
  it("maps a profile into the app user shape with sane defaults", () => {
    const result = mapProfileToUser(profile, {
      id: "override-id",
      email: "roman@example.com",
      phone: "+358401234567",
      hasPassword: true,
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      verificationBadges: [],
    });

    expect(result.id).toBe("override-id");
    expect(result.fullName).toBe("Roman Shrestha");
    expect(result.dateOfBirth).toBe("1990-05-20");
    expect(result.skills).toEqual([]);
  });

  it("maps get-profile responses and falls back to current-user identity fields", () => {
    const response: GetUserProfileApiResponse = {
      userId: "user-1",
      email: "",
      phone: null,
      profile,
    };

    const result = mapGetProfileResponseToUser(response, {
      id: "user-1",
      email: "fallback@example.com",
      phone: "+358401234567",
      isVerified: true,
      createdAt: "2026-06-20T10:00:00.000Z",
      updatedAt: "2026-06-20T10:00:00.000Z",
    });

    expect(result?.email).toBe("");
    expect(result?.phone).toBe("+358401234567");
    expect(mapGetProfileResponseToUser({ ...response, profile: null })).toBeNull();
  });

  it("maps mutation responses while preserving current user identity data", () => {
    const response: UpdateUserProfileApiResponse = {
      status: "success",
      message: "Updated",
      profile,
      phone: "+358400000000",
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      verificationBadges: [],
    };

    const result = mapProfileMutationResponseToUser(response, {
      id: "current-user",
      email: "roman@example.com",
      phone: "+358411111111",
      isVerified: true,
      fullName: "Old Name",
      userType: UserType.GENERAL,
      rating: 0,
      helpCount: 0,
      skills: [],
      certifications: [],
      verificationBadges: [],
    });

    expect(result.id).toBe("current-user");
    expect(result.email).toBe("roman@example.com");
    expect(result.phone).toBe("+358400000000");
  });
});
