import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Screen, Stack, Row, theme } from "@/design-system";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useUser } from "@/features/user/hooks/user.hook";
import { DangerZoneCard } from "@/features/user/components/DangerZoneCard";
import { DeleteAccountModal } from "@/features/settings/components/DeleteAccountModal";
import {
  ProfileAvatarPickerModal,
  ProfileEditForm,
  ProfileHeaderCard,
  ProfileInfoSection,
  ProfileStatsRow,
  SessionCard,
  SettingsSectionCard,
} from "@/features/user/components/";

import { ThemeModeCard } from "@/features/settings/components/ThemeModeCard";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { showToast } from "@/utils/toast";

export default function ProfileTabScreen() {
  const { palette } = useThemeContext();
  const { handleLogout, loadingLogout } = useAuth();
  const {
    user,
    loading,
    error,
    loadUserProfile,
    handleUpdateProfile,
    handleDeleteProfile,
  } = useUser();



  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const settingsItems = useMemo(
    () => [
      {
        id: "notifications",
        title: "Notifications",
        subtitle: "Manage alerts and app updates",
        onPress: () =>
          Alert.alert("Coming soon", "Notifications settings will be added next."),
      },
      {
        id: "privacy",
        title: "Privacy & security",
        subtitle: "Control your profile visibility and account safety",
        onPress: () =>
          Alert.alert("Coming soon", "Privacy settings will be added next."),
      },
      {
        id: "support",
        title: "Help & support",
        subtitle: "Get help, report issues, or contact support",
        onPress: () =>
          Alert.alert("Coming soon", "Support section will be added next."),
      },
    ],
    []
  );

  const handleDeleteAccountPress = () => {
    setDeleteAccountModalVisible(true);
  };

  return (
    <Screen showsVerticalScrollIndicator={false}>
      <Stack gap="sm">
        <Row justify="space-between" align="center">
          <View style={styles.titleWrap}>
            <Text style={[styles.screenTitle, { color: palette.textPrimary }]}>Profile</Text>
            <Text style={[styles.screenSubtitle, { color: palette.textSecondary }]}>
              Manage your information and settings
            </Text>
          </View>

          <Pressable
            style={[
              styles.editTopButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={[styles.editTopButtonText, { color: palette.primary }]}>Edit</Text>
          </Pressable>
        </Row>

        {loading && !user ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <Stack gap="sm">
            <ProfileHeaderCard
              user={user}
              loading={loading}
              onAvatarPress={() => setAvatarModalVisible(true)}
              onUploadPress={() => setAvatarModalVisible(true)}
              onDeletePress={() => setAvatarModalVisible(true)}
            />

            <ProfileStatsRow rating={user?.rating ?? 0} helpCount={user?.helpCount ?? 0} />

            <ProfileInfoSection user={user} />
            <ThemeModeCard />
            <SessionCard loading={loadingLogout} onLogout={handleLogout} />
            <SettingsSectionCard title="Settings" items={settingsItems} />

            <DeleteAccountModal
              visible={deleteAccountModalVisible}
              loading={loading}
              error={error}
              onClose={() => setDeleteAccountModalVisible(false)}
              onConfirm={async (password) => {
                const success = await handleDeleteProfile(password);
                if (success) {
                  showToast("Account deleted");
                }
                return success;
              }}
            />

            <DangerZoneCard loading={loading} onDeleteAccount={handleDeleteAccountPress} />


            {error ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
            ) : null}
          </Stack>
        )}

        <ProfileAvatarPickerModal
          visible={avatarModalVisible}
          onClose={() => setAvatarModalVisible(false)}
        />

        <Modal
          visible={editModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <Screen withTabBarSpacing={false}>
            <Stack gap="md">
              <Row justify="space-between" align="center" style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Edit profile
                </Text>

                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Text style={[styles.closeText, { color: palette.textSecondary }]}>Close</Text>
                </Pressable>
              </Row>

              <ProfileEditForm
                user={user}
                loading={loading}
                onSubmit={async (payload) => {
                  const success = await handleUpdateProfile(payload);
                  if (success) {
                    setEditModalVisible(false);
                  }
                  return success;
                }}
                onCancel={() => setEditModalVisible(false)}
              />

            </Stack>
          </Screen>
        </Modal>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  screenTitle: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  screenSubtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  editTopButton: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editTopButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  loadingWrap: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
  },
  modalHeader: {
    paddingTop: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  closeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
});