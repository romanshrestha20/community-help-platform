import { Platform } from "react-native";
import * as userApi from "../api/user.api";
import {
  AvatarUploadInput,
  CertificationUploadInput,
  Skill,
  UpdateUserProfilePayload,
  User,
  UserResponse,
} from "../types/user.types";
import { User as AuthUser } from "@/features/auth/types/auth.types";
import {
  mapGetProfileResponseToUser,
  mapProfileMutationResponseToUser,
} from "../mappers/user.mapper";

import { showToast } from "@/utils/toast";

const buildUploadFormData = async (
  fieldName: string,
  file: AvatarUploadInput
): Promise<FormData> => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    if (file.webFile) {
      formData.append(fieldName, file.webFile, file.name ?? `${fieldName}-${Date.now()}.jpg`);
      return formData;
    }

    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, file.name ?? `${fieldName}-${Date.now()}.jpg`);
    return formData;
  }

  formData.append(fieldName, {
    uri: file.uri,
    name: file.name ?? `${fieldName}-${Date.now()}.jpg`,
    type: file.type ?? "image/jpeg",
  } as any);

  return formData;
};

export const fetchUserProfile = async (
  currentUser?: Pick<
    User,
    "id" | "email" | "phone" | "hasPassword" | "isVerified" | "isEmailVerified" | "isPhoneVerified"
  > |
    AuthUser |
    null
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
    showToast("error", "Failed to fetch user profile");

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
    const payload = {
      fullName: profileData.fullName,
      phone: profileData.phone?.trim() ? profileData.phone : undefined,
      bio: profileData.bio,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      userType: profileData.userType,
      location: profileData.address
        ? {
          latitude: profileData.address.latitude,
          longitude: profileData.address.longitude,
          addressLine1: profileData.address.addressLine1 ?? null,
          addressLine2: profileData.address.addressLine2 ?? null,
          city: profileData.address.city ?? null,
          state: profileData.address.state ?? null,
          postalCode: profileData.address.postalCode ?? null,
          country: profileData.address.country ?? null,
          formattedAddress: profileData.address.formattedAddress ?? null,
        }
        : undefined,
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

    const formData = await buildUploadFormData("avatar", file);
    const data = await userApi.uploadUserAvatar(formData);

    showToast("success", "Avatar updated successfully");

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
    showToast("error", "Failed to upload avatar");
    return {
      success: false,
      data: null,
      message: backendMessage,
    };
  }
};

export const fetchAvailableSkills = async (): Promise<Skill[]> => {
  try {
    return await userApi.getSkills();
  } catch (error) {
    console.error("Fetch skills error:", error);
    return [];
  }
};

export const replaceUserSkillsService = async (
  skills: NonNullable<UpdateUserProfilePayload["skills"]>,
  currentUser: User | null
): Promise<UserResponse> => {
  try {
    const data = await userApi.replaceUserSkills(skills);

    return {
      success: true,
      data: mapProfileMutationResponseToUser(data, currentUser),
      message: data.message || "Skills updated successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to update skills";

    console.error("Replace user skills error:", error);
    return {
      success: false,
      data: null,
      message: backendMessage,
    };
  }
};

export const uploadUserCertificationService = async (
  file: CertificationUploadInput,
  currentUser: User | null
): Promise<UserResponse> => {
  try {
    if (!file?.uri) {
      return {
        success: false,
        data: null,
        message: "Certification proof is required",
      };
    }

    const formData = await buildUploadFormData("proof", file);
    formData.append("name", file.certificationName.trim());
    formData.append("issuer", file.issuer.trim());

    if (file.credentialId?.trim()) {
      formData.append("credentialId", file.credentialId.trim());
    }

    if (file.issuedAt?.trim()) {
      formData.append("issuedAt", file.issuedAt.trim());
    }

    if (file.expiresAt?.trim()) {
      formData.append("expiresAt", file.expiresAt.trim());
    }

    const data = await userApi.uploadUserCertification(formData);

    return {
      success: true,
      data: mapProfileMutationResponseToUser(data, currentUser),
      message: data.message || "Certification uploaded successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to upload certification";

    console.error("Upload certification error:", error);
    return {
      success: false,
      data: null,
      message: backendMessage,
    };
  }
};

export const deleteUserCertificationService = async (
  certificationId: string,
  currentUser: User | null
): Promise<UserResponse> => {
  try {
    const data = await userApi.deleteUserCertification(certificationId);

    return {
      success: true,
      data: mapProfileMutationResponseToUser(data, currentUser),
      message: data.message || "Certification deleted successfully",
    };
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to delete certification";

    console.error("Delete certification error:", error);
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
    showToast("error", "Failed to delete avatar");
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
    showToast("error", "Failed to delete user profile");

    return {
      success: false,
      message: backendMessage,
    };
  }
};
