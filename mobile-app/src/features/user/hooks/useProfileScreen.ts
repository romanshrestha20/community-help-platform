import { useState, useEffect } from "react";
import { useProfileForm } from "@/features/user/profile/hooks/useProfileForm";
import { useUser } from "@/features/user/hooks/user.hook";
import { Gender, UserType } from "@/features/user/types/user.types";

export const useProfileScreen = () => {
  const { user, loading, error, loadUserProfile, handleUpdateProfile, handleDeleteProfile } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const formHook = useProfileForm(user);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const startEditing = () => setIsEditing(true);
  const cancelEditing = () => { formHook.resetForm(); setIsEditing(false); };

  const startDelete = () => setIsDeleteConfirming(true);
  const cancelDelete = () => { setDeletePassword(""); setIsDeleteConfirming(false); };

  const updateProfile = async () => {
    setActionLoading(true);
    const result = await handleUpdateProfile(formHook.form);
    setActionLoading(false);
    if (result.success) setIsEditing(false);
    return result.success;
  };

  const confirmDelete = async () => {
    if (!deletePassword.trim()) return false;
    setActionLoading(true);
    const success = await handleDeleteProfile(deletePassword);
    setActionLoading(false);
    if (success) setIsDeleteConfirming(false);
    return success;
  };

  return {
    user,
    loading,
    error,
    isEditing,
    isDeleteConfirming,
    deletePassword,
    setDeletePassword,
    actionLoading,
    formHook,
    startEditing,
    cancelEditing,
    startDelete,
    cancelDelete,
    updateProfile,
    confirmDelete
  };
};
