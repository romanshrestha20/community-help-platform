import * as userApi from "./user.api";
import { UpdateUserProfilePayload, User, UserResponse } from "./user.types";

const formatDateOnly = (value?: string | Date | null) => {
  if (!value) return "";
  const str = typeof value === "string" ? value : value.toISOString();
  return str.includes("T") ? str.split("T")[0] : str;
};

// Transform supported API shapes to flattened User:
// 1) { success, data: userWithProfile }
// 2) userWithProfile
// 3) { success, data: profileOnly }
// 4) profileOnly
const transformApiUser = (apiResponse: any, currentUser?: User | null): User => {
  const payload = apiResponse?.data ?? apiResponse;
  const profile = payload?.profile ?? payload ?? {};
  const address = profile?.address ?? null;

  return {
    id: payload?.id ?? currentUser?.id ?? "",
    email: payload?.email ?? currentUser?.email ?? "",
    phone: payload?.phone ?? currentUser?.phone ?? "",
    isVerified: payload?.isVerified ?? currentUser?.isVerified ?? false,
    fullName: profile?.fullName ?? currentUser?.fullName ?? "",
    bio: profile?.bio ?? currentUser?.bio ?? "",
    dateOfBirth: formatDateOnly(profile?.dateOfBirth ?? currentUser?.dateOfBirth),
    gender: profile?.gender ?? currentUser?.gender,
    userType: profile?.userType ?? currentUser?.userType,
    rating: profile?.rating ?? currentUser?.rating ?? 0,
    helpCount: profile?.helpCount ?? currentUser?.helpCount ?? 0,
    address,
  };
};

// Fetch user profile
export const fetchUserProfile = async (): Promise<UserResponse> => {
  try {
    const data = await userApi.getUserProfile();
    return { success: true, data: transformApiUser(data), message: "User profile retrieved successfully" };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to fetch user profile";
    console.error("Fetch user profile error:", error);
    return { success: false, data: null, message: backendMessage };
  }
};

// Update user profile
export const updateUserProfileService = async (
  profileData: Partial<UpdateUserProfilePayload>,
  currentUser: User | null
): Promise<UserResponse> => {
  try {
    const apiProfileData = {
      fullName: profileData.fullName,
      bio: profileData.bio,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      userType: profileData.userType,
      rating: profileData.rating,
      helpCount: profileData.helpCount,
      address: profileData.address,
    };
    const data = await userApi.updateUserProfile(apiProfileData);
    return { success: true, data: transformApiUser(data, currentUser), message: "User profile updated successfully" };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to update user profile";
    console.error("Update user profile error:", error);
    return { success: false, data: null, message: backendMessage };
  }
};

// Delete user profile
export const deleteUserProfileService = async (password: string): Promise<{ success: boolean; message: string }> => {
  try {
    await userApi.deleteUserProfile(password);
    return { success: true, message: "User profile deleted successfully" };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to delete user profile";
    console.error("Delete user profile error:", error);
    return { success: false, message: backendMessage };
  }
};