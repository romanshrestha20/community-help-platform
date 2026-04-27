import { useCallback } from "react";
import { useUserStore } from "../store/user.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { clearTokens } from "@/utils/token";
import {
  deleteUserCertificationService,
  deleteUserAvatarService,
  deleteUserProfileService,
  fetchUserProfile,
  replaceUserSkillsService,
  updateUserProfileService,
  uploadUserCertificationService,
  uploadUserAvatarService,
} from "../services/user.service";
import {
  AvatarUploadInput,
  CertificationUploadInput,
  UpdateUserProfilePayload,
} from "../types/user.types";

export const useUser = () => {
  const logout = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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

      useAuthStore.setState((state) => {
        const currentProfile = state.user?.profile ?? authUser.profile ?? null;

        return {
          ...state,
          user: {
            ...state.user,
            ...authUser,
            id: nextUser.id,
            email: nextUser.email,
            phone: nextUser.phone,
            hasPassword: nextUser.hasPassword ?? state.user?.hasPassword ?? authUser?.hasPassword,
            isVerified: nextUser.isVerified,
            isEmailVerified: nextUser.isEmailVerified,
            isPhoneVerified: nextUser.isPhoneVerified,
            fullName: nextUser.fullName,
            avatarUrl: nextUser.avatarUrl ?? null,
            profile: currentProfile
              ? {
                  ...currentProfile,
                  fullName: nextUser.fullName,
                  bio: nextUser.bio ?? null,
                  dateOfBirth: nextUser.dateOfBirth ?? null,
                  gender: nextUser.gender ?? null,
                  userType: nextUser.userType,
                  rating: nextUser.rating,
                  helpCount: nextUser.helpCount,
                  avatarUrl: nextUser.avatarUrl ?? null,
                  address: nextUser.address ?? null,
                  skills: nextUser.skills ?? [],
                  certifications: nextUser.certifications ?? [],
                }
              : null,
          },
        };
      });
    },
    [authUser]
  );

  const loadUserProfile = useCallback(async () => {
    if (!isAuthenticated || !authUser) {
      clearUser();
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchUserProfile(authUser);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to load profile");
      }

    setLoading(false);
  }, [authUser, clearUser, isAuthenticated, setError, setLoading, setUser, syncAuthUser]);

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
      return {
        success: result.success,
        message: result.message || (result.success ? null : "Failed to update profile"),
      };
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

  const handleReplaceUserSkills = useCallback(
    async (skills: NonNullable<UpdateUserProfilePayload["skills"]>) => {
      setLoading(true);
      setError(null);

      const result = await replaceUserSkillsService(skills, user);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to update skills");
      }

      setLoading(false);
      return result;
    },
    [setError, setLoading, setUser, syncAuthUser, user]
  );

  const handleUploadCertification = useCallback(
    async (file: CertificationUploadInput) => {
      setLoading(true);
      setError(null);

      const result = await uploadUserCertificationService(file, user);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to upload certification");
      }

      setLoading(false);
      return result;
    },
    [setError, setLoading, setUser, syncAuthUser, user]
  );

  const handleDeleteCertification = useCallback(
    async (certificationId: string) => {
      setLoading(true);
      setError(null);

      const result = await deleteUserCertificationService(certificationId, user);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to delete certification");
      }

      setLoading(false);
      return result;
    },
    [setError, setLoading, setUser, syncAuthUser, user]
  );

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
    handleReplaceUserSkills,
    handleUploadCertification,
    handleDeleteCertification,
    handleDeleteProfile,
  };
};
