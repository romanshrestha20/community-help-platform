import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { ChangePasswordSection } from "@/features/auth/components/ChangePassword";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { Card, Screen, Stack, theme } from "@/design-system";
import { logoutUser } from "@/features/auth/service/auth.service";
import { useUser } from "@/features/user/user.hook";
import { Gender, UserType } from "@/features/user/user.types";
import { ProfileDateField } from "@/features/user/profile/components/ProfileDateField";
import { ProfileInfoRow } from "@/features/user/profile/components/ProfileInfoRow";
import { ProfilePickerField } from "@/features/user/profile/components/ProfilePickerField";
import { ProfileTextField } from "@/features/user/profile/components/ProfileTextField";
import { useProfileForm } from "@/features/user/profile/hooks/useProfileForm";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, error, loadUserProfile, handleUpdateProfile, handleDeleteProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const {
    form,
    showDatePicker,
    setShowDatePicker,
    handleDateChange,
    setFullName,
    setBio,
    setGender,
    setUserType,
    resetForm,
  } = useProfileForm(user);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const updateProfile = async () => {
    const isSuccess = await handleUpdateProfile(form);

    if (isSuccess) {
      setIsEditing(false);
      Toast.show({
        type: "success",
        text1: "Profile updated successfully",
      });
    }
  };

  const cancelEditing = () => {
    resetForm();
    setIsEditing(false);
  };

  const cancelDelete = () => {
    setDeletePassword("");
    setIsDeleteConfirming(false);
  };

  const confirmDelete = async () => {
    if (!deletePassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Password is required",
      });
      return;
    }

    const isSuccess = await handleDeleteProfile(deletePassword);
    if (isSuccess) {
      await logoutUser();
      setDeletePassword("");
      setIsDeleteConfirming(false);
      Toast.show({
        type: "success",
        text1: "Account deleted successfully",
      });
      router.replace("/login");
    }
  };

  if (loading && !user) {
    return (
      <Screen>
        <ActivityIndicator size="large" style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <AppHeader title="Profile" subtitle={isEditing ? "Edit your details" : "View your details"} />

      {error && <Text style={styles.error}>{error}</Text>}

      {isEditing ? (
        <Stack>
          <ProfileTextField
            label="Full Name"
            value={form.fullName}
            onChangeText={setFullName}
          />

          <ProfileTextField
            label="Bio"
            value={form.bio}
            onChangeText={setBio}
          />

          <ProfileDateField
            value={form.dateOfBirth}
            showDatePicker={showDatePicker}
            onPress={() => setShowDatePicker(true)}
            onChange={handleDateChange}
          />

          <ProfilePickerField
            label="Gender"
            selectedValue={form.gender}
            options={Object.values(Gender)}
            onValueChange={setGender}
            marginTop={10}
          />

          <ProfilePickerField
            label="User Type"
            selectedValue={form.userType}
            options={Object.values(UserType)}
            onValueChange={setUserType}
            marginBottom={20}
          />

          <AppButton title={loading ? "Updating..." : "Save Profile"} onPress={updateProfile} loading={loading} disabled={loading} />
          <AppButton title="Cancel" onPress={cancelEditing} disabled={loading} />
        </Stack>
      ) : (
        <Stack>
          <ProfileInfoRow label="Full Name" value={form.fullName} />
          <ProfileInfoRow label="Bio" value={form.bio} />
          <ProfileInfoRow label="Date of Birth" value={form.dateOfBirth} />
          <ProfileInfoRow label="Gender" value={form.gender} />
          <ProfileInfoRow label="User Type" value={form.userType} />
          <AppButton title="Edit Profile" onPress={() => setIsEditing(true)} disabled={loading} />
        </Stack>
      )}

      <View style={styles.sectionGap} />
<ChangePasswordSection />
      {isDeleteConfirming ? (
        <Stack>
          <Text style={styles.deleteHint}>Confirm your password to delete account:</Text>
          <AppInput
            label="Password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Enter current password"
          />
          <AppButton
            title={loading ? "Deleting..." : "Confirm Delete"}
            onPress={confirmDelete}
            variant="danger"
            loading={loading}
            disabled={loading}
          />
          <AppButton title="Cancel" onPress={cancelDelete} disabled={loading} />
        </Stack>
      ) : (
        <AppButton style={styles.deleteButton} title="Delete Profile" onPress={() => setIsDeleteConfirming(true)} variant="danger" disabled={loading} />
      )}

      <Toast />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: theme.spacing.xl,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
  },
  sectionGap: {
    height: theme.spacing.md,
  },
  deleteHint: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
  },
 
});