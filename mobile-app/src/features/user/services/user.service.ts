import { Platform } from "react-native";
import * as userApi from "../api/user.api";
import {
  AvatarUploadInput,
  UpdateUserProfilePayload,
  User,
  UserResponse,
} from "../types/user.types";
import {
  mapGetProfileResponseToUser,
  mapProfileMutationResponseToUser,
} from "../mappers/user.mapper";

const buildAvatarFormData = async (file: AvatarUploadInput): Promise<FormData> => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    if (file.webFile) {
      formData.append("avatar", file.webFile, file.name ?? `avatar-${Date.now()}.jpg`);
      return formData;
    }

    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append("avatar", blob, file.name ?? `avatar-${Date.now()}.jpg`);
    return formData;
  }

  formData.append("avatar", {
    uri: file.uri,
    name: file.name ?? `avatar-${Date.now()}.jpg`,
    type: file.type ?? "image/jpeg",
  } as any);

  return formData;
};

export const fetchUserProfile = async (
  currentUser?: User | null
): Promise<UserResponse> => {
  try {
    const data = await userApi.getUserProfile();

    return {
      success: true,
      data: mapGetProfileResponseToUser(data, currentUser),
      message: "User profile retrieved successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to fetch user profile";

    console.error("Fetch user profile error:", error);

    return {
      success: false,
      data: null,
      message: backendMessage,
    };
  }
};

export const updateUserProfileService = async (
  profileData: Partial<UpdateUserProfilePayload>,
  currentUser: User | null
): Promise<UserResponse> => {
  try {
    const payload: Partial<UpdateUserProfilePayload> = {
      fullName: profileData.fullName,
      bio: profileData.bio,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      userType: profileData.userType,
      address: profileData.address,
    };

    const data = await userApi.updateUserProfile(payload);

    return {
      success: true,
      data: mapProfileMutationResponseToUser(data, currentUser),
      message: data.message || "User profile updated successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to update user profile";

    console.error("Update user profile error:", error);

    return {
      success: false,
      data: null,
      message: backendMessage,
    };
  }
};

export const uploadUserAvatarService = async (
  file: AvatarUploadInput,
  currentUser: User | null
): Promise<UserResponse> => {
  try {
    if (!file?.uri) {
      return {
        success: false,
        data: null,
        message: "Avatar image is required",
      };
    }

    const formData = await buildAvatarFormData(file);
    const data = await userApi.uploadUserAvatar(formData);

    return {
      success: true,
      data: mapProfileMutationResponseToUser(data, currentUser),
      message: data.message || "Avatar updated successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to upload avatar";

    console.error("Upload avatar error:", error);

    return {
      success: false,
      data: null,
      message: backendMessage,
    };
  }
};

export const deleteUserAvatarService = async (
  currentUser: User | null
): Promise<UserResponse> => {
  try {
    const data = await userApi.deleteUserAvatar();

    return {
      success: true,
      data: mapProfileMutationResponseToUser(data, currentUser),
      message: data.message || "Avatar deleted successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to delete avatar";

    console.error("Delete avatar error:", error);

    return {
      success: false,
      data: null,
      message: backendMessage,
    };
  }
};

export const deleteUserProfileService = async (password?: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    if (!password?.trim()) {
      return {
        success: false,
        message: "Password is required",
      };
    }

    await userApi.deleteUserProfile(password);

    return {
      success: true,
      message: "User profile deleted successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to delete user profile";

    console.error("Delete user profile error:", error);

    return {
      success: false,
      message: backendMessage,
    };
  }
};
