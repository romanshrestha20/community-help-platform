import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

import { ChangePasswordSection } from "@/features/auth/components/ChangePassword";
import { logoutUser } from "@/features/auth/service/auth.service";
import { useUser } from "@/features/user/hooks/user.hook";
import { useProfileForm } from "@/features/user/profile/hooks/useProfileForm";

import { Card, Screen, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { AppModal } from "@/components/ui/AppModal";
import { useModal } from "@/hooks/useModal";

import { ProfileView } from "@/features/user/components/ProfileView";
import { ProfileEditForm } from "@/features/user/components/ProfileEditForm";
import { useThemeStore } from "@/features/settings/store/theme.store";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import type { ThemeMode } from "@/types/tabBar";

type ProfileOption = {
  id: string;
  label: string;
  description: string;
  onPress: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);

  const { user, loading, error, loadUserProfile, handleUpdateProfile, handleDeleteProfile } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const deleteModal = useModal();
  const logoutModal = useModal();

  const { form, showDatePicker, setShowDatePicker, handleDateChange, setFullName, setBio, setGender, setUserType, resetForm } = useProfileForm(user);

  const quickOptions: ProfileOption[] = [
    {
      id: "notifications",
      label: "Notification Preferences",
      description: "Control push and email notifications",
      onPress: () => Toast.show({ type: "info", text1: "Coming soon" }),
    },
    {
      id: "privacy",
      label: "Privacy Settings",
      description: "Manage profile visibility and data sharing",
      onPress: () => Toast.show({ type: "info", text1: "Coming soon" }),
    },
    {
      id: "language",
      label: "Language & Region",
      description: "Set app language, date and number format",
      onPress: () => Toast.show({ type: "info", text1: "Coming soon" }),
    },
    {
      id: "help",
      label: "Help & Support",
      description: "Get help and contact support",
      onPress: () => Toast.show({ type: "info", text1: "Coming soon" }),
    },
  ];

  const accountActions: ProfileOption[] = [
    {
      id: "logout",
      label: "Log Out",
      description: "Sign out from this account",
      onPress: logoutModal.open,
    },
    {
      id: "delete",
      label: "Delete Account",
      description: "Permanently remove your account and data",
      onPress: deleteModal.open,
      danger: true,
    },
  ];

  const themeOptions: { mode: ThemeMode; label: string }[] = [
    { mode: "system", label: "System" },
    { mode: "light", label: "Light" },
    { mode: "dark", label: "Dark" },
  ];

  const handleThemeModeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    Toast.show({
      type: "success",
      text1: `Theme set to ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
    });
  };

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const updateProfile = async () => {
    setActionLoading(true);
    const success = await handleUpdateProfile(form);
    setActionLoading(false);

    if (success) {
      setIsEditing(false);
      Toast.show({ type: "success", text1: "Profile updated" });
    }
  };

  const confirmDelete = async () => {
    if (!deletePassword.trim()) {
      Toast.show({ type: "error", text1: "Password required" });
      return;
    }

    setActionLoading(true);
    const success = await handleDeleteProfile(deletePassword);
    setActionLoading(false);

    if (success) {
      await logoutUser();
      deleteModal.close();
      router.replace("/login");
    }
  };

  const confirmLogout = async () => {
    await logoutUser();
    logoutModal.close();
    router.replace("/login");
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
      <AppHeader
        title="Profile"
        subtitle={isEditing ? "Edit your details" : "Manage your account and preferences"}
      />

      {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Account Overview</Text>
        <View style={styles.accountRow}>
          <Text style={[styles.accountLabel, { color: palette.textSecondary }]}>Email</Text>
          <Text style={[styles.accountValue, { color: palette.textPrimary }]}>{user?.email || "Not available"}</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={[styles.accountLabel, { color: palette.textSecondary }]}>Status</Text>
          <Text style={[styles.accountValue, { color: user?.isVerified ? palette.success : palette.warning }]}>
            {user?.isVerified ? "Verified" : "Unverified"}
          </Text>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Profile Details</Text>
          {!isEditing && (
            <AppButton
              title="Edit"
              onPress={() => setIsEditing(true)}
              fullWidth={false}
            />
          )}
        </View>

        {isEditing ? (
          <ProfileEditForm
            formHook={{
              form,
              showDatePicker,
              setShowDatePicker,
              handleDateChange,
              setFullName,
              setBio,
              setGender,
              setUserType,
            }}
            onSave={updateProfile}
            onCancel={() => {
              resetForm();
              setIsEditing(false);
            }}
            loading={actionLoading}
          />
        ) : (
          <ProfileView form={form} onEdit={() => setIsEditing(true)} loading={loading} />
        )}
      </Card>


      {/* my requests */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>My Requests</Text>
        <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>View and manage your help requests</Text>
        <AppButton title="View My Requests" onPress={() => router.push("/(tabs)/profile/requests")} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Security</Text>
        <ChangePasswordSection />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Preferences</Text>
        <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>Easily add future options by extending this list</Text>

        <View style={[styles.appearanceRow, { borderTopColor: palette.border }] }>
          <Text style={[styles.appearanceLabel, { color: palette.textPrimary }]}>Appearance</Text>
          <View style={styles.themeToggleWrap}>
            {themeOptions.map((option) => {
              const isActive = themeMode === option.mode;
              return (
                <Pressable
                  key={option.mode}
                  onPress={() => {
                    void handleThemeModeChange(option.mode);
                  }}
                  style={[
                    styles.themeToggleButton,
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.surfaceMuted,
                    },
                    isActive && {
                      borderColor: palette.primary,
                      backgroundColor: palette.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeToggleButtonText,
                      { color: palette.textSecondary },
                      isActive && { color: palette.textInverse },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {quickOptions.map((option) => (
          <ProfileOptionRow key={option.id} option={option} />
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Account Actions</Text>
        {accountActions.map((option) => (
          <ProfileOptionRow key={option.id} option={option} />
        ))}
      </Card>

      <Toast />

      {/* DELETE MODAL */}
      <AppModal
        visible={deleteModal.visible}
        title="Delete Account"
        onClose={deleteModal.close}
        actions={
          <>
            <AppButton title="Cancel" onPress={deleteModal.close} fullWidth={false} />
            <AppButton title="Delete" variant="danger" onPress={confirmDelete} fullWidth={false} />
          </>
        }
      >
        <Text style={[styles.modalText, { color: palette.textSecondary }]}>Enter password to confirm</Text>
        <AppInput
          label="Password"
          value={deletePassword}
          onChangeText={setDeletePassword}
          secureTextEntry
        />
      </AppModal>

      {/* LOGOUT MODAL */}
      <AppModal
        visible={logoutModal.visible}
        title="Logout"
        onClose={logoutModal.close}
        actions={
          <>
            <AppButton title="Cancel" onPress={logoutModal.close} fullWidth={false} />
            <AppButton title="Logout" onPress={confirmLogout} fullWidth={false} />
          </>
        }
      >
        <Text style={[styles.modalText, { color: palette.textSecondary }]}>Are you sure you want to logout?</Text>
      </AppModal>
    </Screen>
  );
}

const ProfileOptionRow = ({ option }: { option: ProfileOption }) => {
  const { palette } = useThemeContext();

  return (
    <Pressable style={[styles.optionRow, { borderTopColor: palette.border }]} onPress={option.onPress}>
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionLabel, { color: option.danger ? palette.danger : palette.textPrimary }]}>{option.label}</Text>
        <Text style={[styles.optionDescription, { color: palette.textSecondary }]}>{option.description}</Text>
      </View>
      <Text style={[styles.optionChevron, { color: palette.textSecondary }]}>›</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  loader: {
    marginTop: theme.spacing.xl,
  },
  error: {
    marginBottom: theme.spacing.sm,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  appearanceRow: {
    borderTopWidth: 1,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  appearanceLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  themeToggleWrap: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  themeToggleButton: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  themeToggleButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  accountLabel: {
    fontSize: theme.typography.fontSize.sm,
  },
  accountValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingVertical: theme.spacing.sm,
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  optionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: theme.typography.fontSize.xs,
  },
  optionChevron: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  modalText: {
    marginBottom: 10,
    fontSize: 14,
  },
});