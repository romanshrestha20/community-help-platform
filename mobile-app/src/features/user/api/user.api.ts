import apiClient from "@/api/api-client";
import {
  DeleteAvatarApiResponse,
  GetUserProfileApiResponse,
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

export const deleteUserProfile = async (password: string): Promise<void> => {
  await apiClient.delete("/auth/profile", {
    data: {
      password,
    },
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
