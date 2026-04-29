import apiClient from "@/api/api-client";
import {
  DeleteAvatarApiResponse,
  GetUserProfileApiResponse,
  Skill,
  UpdateUserProfileApiResponse,
  UpdateUserProfilePayload,
  UploadAvatarApiResponse,
} from "../types/user.types";

export const getUserProfile = async (): Promise<GetUserProfileApiResponse> => {
  const response = await apiClient.get<GetUserProfileApiResponse>("/auth/profile");
  return response.data;
};

export const updateUserProfile = async (
  profileData: Partial<UpdateUserProfilePayload>
): Promise<UpdateUserProfileApiResponse> => {
  const response = await apiClient.patch<UpdateUserProfileApiResponse>(
    "/auth/profile",
    profileData,
    {
      skipErrorToast: true,
    }
  );
  return response.data;
};

export const deleteUserProfile = async (password?: string): Promise<void> => {
  await apiClient.delete("/auth/profile", {
    data: password?.trim() ? { password: password.trim() } : {},
  });
};

export const uploadUserAvatar = async (
  formData: FormData
): Promise<UploadAvatarApiResponse> => {
  const response = await apiClient.post<UploadAvatarApiResponse>(
    "/auth/profile/avatar",
    formData
  );
  return response.data;
};

export const deleteUserAvatar = async (): Promise<DeleteAvatarApiResponse> => {
  const response = await apiClient.delete<DeleteAvatarApiResponse>("/auth/profile/avatar");
  return response.data;
};

export const getSkills = async (): Promise<Skill[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Skill[];
  }>("/skills");
  return response.data.data ?? [];
};

export const replaceUserSkills = async (
  skills: NonNullable<UpdateUserProfilePayload["skills"]>
): Promise<UpdateUserProfileApiResponse> => {
  const response = await apiClient.put<UpdateUserProfileApiResponse>(
    "/auth/profile/skills",
    { skills },
    {
      skipErrorToast: true,
    }
  );
  return response.data;
};

export const uploadUserCertification = async (
  formData: FormData
): Promise<UpdateUserProfileApiResponse> => {
  const response = await apiClient.post<UpdateUserProfileApiResponse>(
    "/auth/profile/certifications",
    formData,
    {
      skipErrorToast: true,
    }
  );
  return response.data;
};

export const deleteUserCertification = async (
  certificationId: string
): Promise<UpdateUserProfileApiResponse> => {
  const response = await apiClient.delete<UpdateUserProfileApiResponse>(
    `/auth/profile/certifications/${certificationId}`,
    {
      skipErrorToast: true,
    }
  );
  return response.data;
};
