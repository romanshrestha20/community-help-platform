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
  const authUserId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const canAccessProfileRoutes = useAuthStore((state) =>
    Boolean(
      state.isAuthenticated &&
        state.user &&
        state.user.id
    )
  );
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
      if (!nextUser) return;

      useAuthStore.setState((state) => {
        if (!state.user) {
          return state;
        }

        const currentProfile = state.user.profile ?? null;

        return {
          ...state,
          user: {
            ...state.user,
            id: nextUser.id,
            email: nextUser.email,
            phone: nextUser.phone,
            hasPassword: nextUser.hasPassword ?? state.user.hasPassword,
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
                  searchRadiusMeters: nextUser.searchRadiusMeters ?? null,
                  address: nextUser.address ?? null,
                  skills: nextUser.skills ?? [],
                  certifications: nextUser.certifications ?? [],
                }
              : null,
          },
        };
      });
    },
    []
  );

  const loadUserProfile = useCallback(async () => {
    if (!isAuthenticated || !authUserId || !canAccessProfileRoutes) {
      clearUser();
      return;
    }

    setLoading(true);
    setError(null);

    const latestAuthUser = useAuthStore.getState().user;
    const result = await fetchUserProfile(latestAuthUser);

      if (result.success && result.data) {
        setUser(result.data);
        syncAuthUser(result.data);
      } else {
        setError(result.message || "Failed to load profile");
      }

    setLoading(false);
  }, [
    authUserId,
    canAccessProfileRoutes,
    clearUser,
    isAuthenticated,
    setError,
    setLoading,
    setUser,
    syncAuthUser,
  ]);

  const handleUpdateProfile = useCallback(
    async (profileData: Partial<UpdateUserProfilePayload>) => {
      if (!canAccessProfileRoutes) {
        const message = "Account verification required";
        setError(message);
        return {
          success: false,
          message,
        };
      }

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
    [canAccessProfileRoutes, user, setUser, setLoading, setError, syncAuthUser]
  );

  const handleUploadAvatar = useCallback(
    async (file: AvatarUploadInput) => {
      if (!canAccessProfileRoutes) {
        setError("Account verification required");
        return false;
      }

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
    [canAccessProfileRoutes, user, setUser, setLoading, setError, syncAuthUser]
  );

  const handleDeleteAvatar = useCallback(async () => {
    if (!canAccessProfileRoutes) {
      setError("Account verification required");
      return false;
    }

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
  }, [canAccessProfileRoutes, user, setUser, setLoading, setError, syncAuthUser]);

  const handleReplaceUserSkills = useCallback(
    async (skills: NonNullable<UpdateUserProfilePayload["skills"]>) => {
      if (!canAccessProfileRoutes) {
        return {
          success: false,
          message: "Account verification required",
          data: null,
        };
      }

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
    [canAccessProfileRoutes, setError, setLoading, setUser, syncAuthUser, user]
  );

  const handleUploadCertification = useCallback(
    async (file: CertificationUploadInput) => {
      if (!canAccessProfileRoutes) {
        return {
          success: false,
          message: "Account verification required",
          data: null,
        };
      }

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
    [canAccessProfileRoutes, setError, setLoading, setUser, syncAuthUser, user]
  );

  const handleDeleteCertification = useCallback(
    async (certificationId: string) => {
      if (!canAccessProfileRoutes) {
        return {
          success: false,
          message: "Account verification required",
          data: null,
        };
      }

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
    [canAccessProfileRoutes, setError, setLoading, setUser, syncAuthUser, user]
  );

  const handleDeleteProfile = useCallback(async (password?: string) => {
    if (!canAccessProfileRoutes) {
      setError("Account verification required");
      return false;
    }

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
  }, [canAccessProfileRoutes, clearUser, logout, setLoading, setError]);

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
