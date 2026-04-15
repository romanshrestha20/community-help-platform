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
import { useRouter } from "expo-router";

import { Screen, Stack, Row, Card, theme } from "@/design-system";
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
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { APP_ROUTES } from "@/config/routes";

export default function ProfileTabScreen() {
  const { palette } = useThemeContext();
  const router = useRouter();
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
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
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
        onPress: () => router.push(APP_ROUTES.PROFILE_NOTIFICATIONS),
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

  const activityShortcuts = useMemo(
    () => [
      {
        id: "requests",
        title: "My Requests",
        subtitle: "Create, edit, and monitor the requests you posted.",
        onPress: () => router.push(APP_ROUTES.PROFILE_REQUESTS),
      },
      {
        id: "bids",
        title: "My Bids",
        subtitle: "Review and update the bids you have placed.",
        onPress: () => router.push(APP_ROUTES.PROFILE_BIDS),
      },
      {
        id: "history",
        title: "Activity History",
        subtitle: "See completed and cancelled requests and bid outcomes.",
        onPress: () => Alert.alert("Coming soon", "Activity history will be available soon."),
      },
    ],
    [router]
  );

  const handleDeleteAccountPress = () => {
    setDeleteAccountModalVisible(true);
  };

  const handleTopLogoutPress = () => {
    if (loadingLogout) return;
    setSessionModalVisible(true);
  };

  return (
    <Screen showsVerticalScrollIndicator={false}>
      <Stack gap="md">
        <Row justify="space-between" align="center">
          <View style={styles.titleWrap}>
            <Text style={[styles.screenTitle, { color: palette.textPrimary }]}>Profile</Text>
            <Text style={[styles.screenSubtitle, { color: palette.textSecondary }]}>
              Manage your account, activity, and settings
            </Text>
          </View>

          <Pressable
            style={[
              styles.topLogoutButton,
              {
                backgroundColor: palette.dangerSoft,
                borderColor: palette.danger,
              },
            ]}
            onPress={handleTopLogoutPress}
            disabled={loadingLogout}
          >
            <Text style={[styles.topLogoutButtonText, { color: palette.danger }]}>
              {loadingLogout ? "Logging out..." : "Logout"}
            </Text>
          </Pressable>
        </Row>

        {loading && !user ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <Stack gap="md">
            <View style={styles.identityGroup}>
              <ProfileHeaderCard
                user={user}
                loading={loading}
                onAvatarPress={() => setAvatarModalVisible(true)}
                onUploadPress={() => setAvatarModalVisible(true)}
                onDeletePress={() => setAvatarModalVisible(true)}
              />

              <ProfileStatsRow rating={user?.rating ?? 0} helpCount={user?.helpCount ?? 0} />
            </View>

            <Card>
              <Stack gap="md">
                <View>
                  <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>My Activity</Text>
                  <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>Quick links to your active requests, bids, and history.</Text>
                </View>

                <Stack gap="sm">
                  {activityShortcuts.map((shortcut) => (
                    <Pressable
                      key={shortcut.id}
                      style={[
                        styles.activityRow,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.border,
                        },
                      ]}
                      onPress={shortcut.onPress}
                    >
                      <View style={styles.activityTextWrap}>
                        <Text style={[styles.activityTitle, { color: palette.textPrimary }]}>{shortcut.title}</Text>
                        <Text style={[styles.activitySubtitle, { color: palette.textSecondary }]}>{shortcut.subtitle}</Text>
                      </View>
                      <Text style={[styles.linkText, { color: palette.primary }]}>Open</Text>
                    </Pressable>
                  ))}
                </Stack>
              </Stack>
            </Card>

            <Stack gap="sm" style={styles.settingsGroup}>
              <ProfileInfoSection user={user} onEditProfile={() => setEditModalVisible(true)} />

              <ThemeModeCard />
              <SettingsSectionCard title="Settings" items={settingsItems} />
            </Stack>

            <DeleteAccountModal
              visible={deleteAccountModalVisible}
              loading={loading}
              error={error}
              onClose={() => setDeleteAccountModalVisible(false)}
              onConfirm={async (password) => {
                const success = await handleDeleteProfile(password);
                if (success) {
                  showSuccessToast("Account deleted successfully");
                }
                return success;
              }}
            />

            <View style={styles.dangerWrap}>
              <DangerZoneCard loading={loading} onDeleteAccount={handleDeleteAccountPress} />
            </View>


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
          visible={sessionModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSessionModalVisible(false)}
        >
          <Screen withTabBarSpacing={false}>
            <Stack gap="md">
              <Row justify="space-between" align="center" style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Session</Text>

                <Pressable onPress={() => setSessionModalVisible(false)}>
                  <Text style={[styles.closeText, { color: palette.textSecondary }]}>Close</Text>
                </Pressable>
              </Row>

              <SessionCard
                loading={loadingLogout}
                onLogout={async () => {
                  try {
                    await handleLogout();
                    setSessionModalVisible(false);
                    showSuccessToast("Logged out successfully");
                    router.replace(APP_ROUTES.AUTH_LOGIN);
                  } catch {
                    showErrorToast("Logout failed", "Please try again.");
                  }
                }}
              />
            </Stack>
          </Screen>
        </Modal>

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
  topLogoutButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  topLogoutButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  loadingWrap: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  identityGroup: {
    rowGap: theme.spacing.sm,
  },
  settingsGroup: {
    rowGap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionSubtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  activityRow: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activityTextWrap: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  activityTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  activitySubtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  linkText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  dangerWrap: {
    marginTop: theme.spacing.md,
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
