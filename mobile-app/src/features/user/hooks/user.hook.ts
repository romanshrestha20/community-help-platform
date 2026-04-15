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
  const authUser = useAuthStore((state) => state.user);
  const {
    user,
    loading,
    error,
    setUser,
    setLoading,
    setError,
    clearUser,
  } = useUserStore();

  const syncAuthUser = useCallback(
    (nextUser: typeof user) => {
      if (!nextUser || !authUser) return;

      useAuthStore.setState((state) => ({
        ...state,
        user: {
          ...state.user,
          ...authUser,
          id: nextUser.id,
          email: nextUser.email,
          phone: nextUser.phone,
          isVerified: nextUser.isVerified,
          isEmailVerified: nextUser.isEmailVerified,
          isPhoneVerified: nextUser.isPhoneVerified,
          fullName: nextUser.fullName,
          avatarUrl: nextUser.avatarUrl ?? null,
          profile: state.user?.profile
            ? {
                ...state.user.profile,
                fullName: nextUser.fullName,
                bio: nextUser.bio ?? null,
                dateOfBirth: nextUser.dateOfBirth ?? null,
                gender: nextUser.gender ?? null,
                userType: nextUser.userType,
                rating: nextUser.rating,
                helpCount: nextUser.helpCount,
                avatarUrl: nextUser.avatarUrl ?? null,
                address: nextUser.address ?? null,
              }
            : state.user?.profile ?? null,
        },
      }));
    },
    [authUser]
  );

  const loadUserProfile = useCallback(async () => {
    if (user) return;

    setLoading(true);
    setError(null);

    const result = await fetchUserProfile(user);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to load profile");
      }

    setLoading(false);
  }, [user, setUser, setLoading, setError, syncAuthUser]);

  const handleUpdateProfile = useCallback(
    async (profileData: Partial<UpdateUserProfilePayload>) => {
      setLoading(true);
      setError(null);

      const result = await updateUserProfileService(profileData, user);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to update profile");
      }

      setLoading(false);
      return result.success;
    },
    [user, setUser, setLoading, setError, syncAuthUser]
  );

  const handleUploadAvatar = useCallback(
    async (file: AvatarUploadInput) => {
      setLoading(true);
      setError(null);

      const result = await uploadUserAvatarService(file, user);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to upload avatar");
      }

      setLoading(false);
      return result.success;
    },
    [user, setUser, setLoading, setError, syncAuthUser]
  );

  const handleDeleteAvatar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await deleteUserAvatarService(user);

    if (result.success && result.data) {
      setUser(result.data);
      syncAuthUser(result.data);
    } else {
      setError(result.message || "Failed to delete avatar");
    }

    setLoading(false);
    return result.success;
  }, [user, setUser, setLoading, setError, syncAuthUser]);

  const handleDeleteProfile = useCallback(async (password?: string) => {
    setLoading(true);
    setError(null);

    const result = await deleteUserProfileService(password);

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
