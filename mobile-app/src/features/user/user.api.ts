import apiClient from "@/api/api-client";
import { UserResponse, UpdateUserProfilePayload } from "./user.types";

// Get current user's profile
export const getUserProfile = async (): Promise<UserResponse> => {
  const response = await apiClient.get("/auth/profile");
  return response.data;
};

// Update current user's profile
export const updateUserProfile = async (profileData: Partial<UpdateUserProfilePayload>): Promise<UserResponse> => {
  const response = await apiClient.patch("/auth/profile", profileData);
  return response.data;
};

// Delete current user's profile
export const deleteUserProfile = async (password: string): Promise<void> => {
  await apiClient.delete("/auth/profile", {
    data: { password },
  });
};