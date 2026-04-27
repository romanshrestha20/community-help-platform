import {
  DeleteAvatarApiResponse,
  GetUserProfileApiResponse,
  UpdateUserProfileApiResponse,
  UploadAvatarApiResponse,
  User,
  UserProfile,
} from "../types/user.types";
import { User as AuthUser } from "@/features/auth/types/auth.types";

type UserIdentityBase = Pick<
  User,
  | "id"
  | "email"
  | "phone"
  | "hasPassword"
  | "isVerified"
  | "isEmailVerified"
  | "isPhoneVerified"
  | "verificationBadges"
> |
  AuthUser;

const formatDateOnly = (value?: string | Date | null): string | undefined => {
  if (!value) return undefined;

  const str = typeof value === "string" ? value : value.toISOString();
  return str.includes("T") ? str.split("T")[0] : str;
};

export const mapProfileToUser = (
  profile: UserProfile,
  base?: Partial<
    Pick<User, "id" | "email" | "phone" | "hasPassword" | "isVerified" | "isEmailVerified" | "isPhoneVerified">
      & Pick<User, "verificationBadges">
  >
): User => {
  return {
    id: base?.id ?? profile.userId,
    email: base?.email ?? "",
    phone: base?.phone ?? "",
    hasPassword: base?.hasPassword ?? false,
    isVerified: base?.isVerified ?? true,
    isEmailVerified: base?.isEmailVerified ?? true,
    isPhoneVerified: base?.isPhoneVerified ?? false,

    fullName: profile.fullName ?? "",
    bio: profile.bio ?? "",
    dateOfBirth: formatDateOnly(profile.dateOfBirth),
    gender: profile.gender ?? undefined,
    userType: profile.userType,
    rating: profile.rating ?? 0,
    helpCount: profile.helpCount ?? 0,
    avatarUrl: profile.avatarUrl ?? null,
    address: profile.address ?? null,
    skills: profile.skills ?? [],
    certifications: profile.certifications ?? [],
    verificationBadges: base?.verificationBadges ?? [],
  };
};

export const mapGetProfileResponseToUser = (
  response: GetUserProfileApiResponse,
  currentUser?: UserIdentityBase | null
): User | null => {
  if (!response.profile) return null;

  return mapProfileToUser(response.profile, {
    id: response.userId,
    email: response.email ?? currentUser?.email ?? "",
    phone: response.phone ?? currentUser?.phone ?? "",
    hasPassword: response.hasPassword ?? currentUser?.hasPassword ?? false,
    isVerified: response.isVerified ?? currentUser?.isVerified ?? true,
    isEmailVerified: response.isEmailVerified ?? currentUser?.isEmailVerified ?? true,
    isPhoneVerified: response.isPhoneVerified ?? currentUser?.isPhoneVerified ?? false,
    verificationBadges: response.verificationBadges ?? currentUser?.verificationBadges ?? [],
  });
};

export const mapProfileMutationResponseToUser = (
  response:
    | UpdateUserProfileApiResponse
    | UploadAvatarApiResponse
    | DeleteAvatarApiResponse,
  currentUser?: User | null
): User => {
  return mapProfileToUser(response.profile, {
    id: currentUser?.id ?? response.profile.userId,
    email: currentUser?.email ?? "",
    phone: response.phone ?? currentUser?.phone ?? "",
    hasPassword: currentUser?.hasPassword ?? false,
    isVerified: response.isVerified ?? currentUser?.isVerified ?? true,
    isEmailVerified: response.isEmailVerified ?? currentUser?.isEmailVerified ?? true,
    isPhoneVerified: response.isPhoneVerified ?? currentUser?.isPhoneVerified ?? false,
    verificationBadges: response.verificationBadges ?? currentUser?.verificationBadges ?? [],
  });
};
