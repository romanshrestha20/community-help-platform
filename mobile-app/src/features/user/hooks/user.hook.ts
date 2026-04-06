import { useCallback } from "react";
import { useUserStore } from "../store/user.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { clearTokens } from "@/utils/token";
import {
  deleteUserAvatarService,
  deleteUserProfileService,
  fetchUserProfile,
  updateUserProfileService,
  uploadUserAvatarService,
} from "../services/user.service";
import { AvatarUploadInput, UpdateUserProfilePayload } from "../types/user.types";

export const useUser = () => {
  const logout = useAuthStore((state) => state.logout);
  const {
    user,
    loading,
    error,
    setUser,
    setLoading,
    setError,
    clearUser,
  } = useUserStore();

  const loadUserProfile = useCallback(async () => {
    if (user) return;

    setLoading(true);
    setError(null);

    const result = await fetchUserProfile(user);

    if (result.success && result.data) {
      setUser(result.data);
    } else {
      setError(result.message || "Failed to load profile");
    }

    setLoading(false);
  }, [user, setUser, setLoading, setError]);

  const handleUpdateProfile = useCallback(
    async (profileData: Partial<UpdateUserProfilePayload>) => {
      setLoading(true);
      setError(null);

      const result = await updateUserProfileService(profileData, user);

      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setError(result.message || "Failed to update profile");
      }

      setLoading(false);
      return result.success;
    },
    [user, setUser, setLoading, setError]
  );

  const handleUploadAvatar = useCallback(
    async (file: AvatarUploadInput) => {
      setLoading(true);
      setError(null);

      const result = await uploadUserAvatarService(file, user);

      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setError(result.message || "Failed to upload avatar");
      }

      setLoading(false);
      return result.success;
    },
    [user, setUser, setLoading, setError]
  );

  const handleDeleteAvatar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await deleteUserAvatarService(user);

    if (result.success && result.data) {
      setUser(result.data);
    } else {
      setError(result.message || "Failed to delete avatar");
    }

    setLoading(false);
    return result.success;
  }, [user, setUser, setLoading, setError]);

  const handleDeleteProfile = useCallback(async (_password?: string) => {
    setLoading(true);
    setError(null);

    const result = await deleteUserProfileService();

    if (result.success) {
      await clearTokens();
      logout();
      clearUser();
    } else {
      setError(result.message || "Failed to delete profile");
    }

    setLoading(false);
    return result.success;
  }, [clearUser, logout, setLoading, setError]);

  return {
    user,
    loading,
    error,
    loadUserProfile,
    handleUpdateProfile,
    handleUploadAvatar,
    handleDeleteAvatar,
    handleDeleteProfile,
  };
};