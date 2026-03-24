import { useCallback, useState } from "react";
import { fetchUserProfile, updateUserProfileService, deleteUserProfileService } from "./user.service";
import { UpdateUserProfilePayload, User } from "./user.types";


export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchUserProfile();
    if (result.success && result.data) setUser(result.data);
    else setError(result.message || "Failed to load profile");
    setLoading(false);
  }, []);

  const handleUpdateProfile = useCallback(async (profileData: Partial<UpdateUserProfilePayload>) => {
    setLoading(true);
    setError(null);
    const result = await updateUserProfileService(profileData, user);
    if (result.success && result.data) setUser(result.data);
    else setError(result.message || "Failed to update profile");
    setLoading(false);

    return result.success;
  }, [user]);

  const handleDeleteProfile = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);
    const result = await deleteUserProfileService(password);
    if (result.success) setUser(null);
    else setError(result.message || "Failed to delete profile");
    setLoading(false);

    return result.success;
  }, []);

  return { user, loading, error, loadUserProfile, handleUpdateProfile, handleDeleteProfile };
};