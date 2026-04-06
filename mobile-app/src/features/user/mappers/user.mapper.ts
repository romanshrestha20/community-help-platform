import {
  DeleteAvatarApiResponse,
  GetUserProfileApiResponse,
  UpdateUserProfileApiResponse,
  UploadAvatarApiResponse,
  User,
  UserProfile,
} from "../types/user.types";

const formatDateOnly = (value?: string | Date | null): string | undefined => {
  if (!value) return undefined;

  const str = typeof value === "string" ? value : value.toISOString();
  return str.includes("T") ? str.split("T")[0] : str;
};

export const mapProfileToUser = (
  profile: UserProfile,
  base?: Partial<Pick<User, "id" | "email" | "phone" | "isVerified">>
): User => {
  return {
    id: base?.id ?? profile.userId,
    email: base?.email ?? "",
    phone: base?.phone ?? "",
    isVerified: base?.isVerified ?? true,

    fullName: profile.fullName ?? "",
    bio: profile.bio ?? "",
    dateOfBirth: formatDateOnly(profile.dateOfBirth),
    gender: profile.gender ?? undefined,
    userType: profile.userType,
    rating: profile.rating ?? 0,
    helpCount: profile.helpCount ?? 0,
    avatarUrl: profile.avatarUrl ?? null,
    address: profile.address ?? null,
  };
};

export const mapGetProfileResponseToUser = (
  response: GetUserProfileApiResponse,
  currentUser?: User | null
): User | null => {
  if (!response.profile) return null;

  return mapProfileToUser(response.profile, {
    id: response.userId,
    email: response.email ?? currentUser?.email ?? "",
    phone: response.phone ?? currentUser?.phone ?? "",
    isVerified: currentUser?.isVerified ?? true,
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
    phone: currentUser?.phone ?? "",
    isVerified: currentUser?.isVerified ?? true,
  });
};