// src/features/user/user.hook.ts
import { useCallback } from "react";
import { fetchUserProfile, updateUserProfileService, deleteUserProfileService } from "./user.service";
import { UpdateUserProfilePayload } from "./user.types";
import { useUserStore } from "./store/user.store";

export const useUser = () => {
  const { user, loading, error, setUser, setLoading, setError, clearUser } = useUserStore();

  const loadUserProfile = useCallback(async () => {
    if (user) return; // cached
    setLoading(true);
    setError(null);

    const result = await fetchUserProfile();
    if (result.success && result.data) setUser(result.data);
    else setError(result.message || "Failed to load profile");

    setLoading(false);
  }, [user, setUser, setLoading, setError]);

  const handleUpdateProfile = useCallback(async (profileData: Partial<UpdateUserProfilePayload>) => {
    setLoading(true);
    setError(null);

    const result = await updateUserProfileService(profileData, user);
    if (result.success && result.data) setUser(result.data);
    else setError(result.message || "Failed to update profile");

    setLoading(false);
    return result.success;
  }, [user, setUser, setLoading, setError]);

  const handleDeleteProfile = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);

    const result = await deleteUserProfileService(password);
    if (result.success) clearUser();
    else setError(result.message || "Failed to delete profile");

    setLoading(false);
    return result.success;
  }, [clearUser, setLoading, setError]);

  return { user, loading, error, loadUserProfile, handleUpdateProfile, handleDeleteProfile };
};