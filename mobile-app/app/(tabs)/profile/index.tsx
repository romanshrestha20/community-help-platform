// app/(tabs)/profile/index.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Screen, Stack, Row, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { formatCompactAddress } from "@/features/location/utils/address";
import { ThemeModeCard } from "@/features/settings/components/ThemeModeCard";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import {
  ProfileAvatarPickerModal,
  ProfileEditForm,
} from "@/features/user/components/";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { useUser } from "@/features/user/hooks/user.hook";
import { formatPhoneNumberForDisplay } from "@/utils/phone";
import { showErrorToast } from "@/utils/toast";

type ActionItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  metric?: string;
  danger?: boolean;
  onPress: () => void;
};

type InfoItem = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const formatLabel = (value?: string | null) => {
  if (!value) return "Not set";
  return value;
};

const formatEnumLabel = (value?: string | null) => {
  if (!value) return "Not set";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return "Not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function ProfileTabScreen() {
  const { palette } = useThemeContext();
  const router = useRouter();
  const { handleLogout, loadingLogout } = useAuth();
  const { user, loading, error, loadUserProfile, handleUpdateProfile } =
    useUser();

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const hasLoadedProfileRef = useRef(false);

  useEffect(() => {
    if (hasLoadedProfileRef.current) return;

    hasLoadedProfileRef.current = true;
    void loadUserProfile();
  }, [loadUserProfile]);

  const profileCompleteness = useMemo(() => {
    if (!user) return 0;

    const fields = [
      user.fullName,
      user.email,
      user.phone,
      user.bio,
      user.dateOfBirth,
      user.gender,
      user.userType,
      user.address,
      user.avatarUrl,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [user]);

  const completionItems = useMemo(
    () => [
      {
        label: "Add profile photo",
        done: Boolean(user?.avatarUrl),
      },
      {
        label: "Verify phone number",
        done: Boolean(user?.isPhoneVerified),
      },
      {
        label: "Add short bio",
        done: Boolean(user?.bio?.trim()),
      },
      {
        label: "Add address",
        done: Boolean(user?.address),
      },
    ],
    [user]
  );

  const activityItems = useMemo<ActionItem[]>(
    () => [
      {
        id: "requests",
        icon: "clipboard-outline",
        title: "My requests",
        subtitle: "Create, edit, and monitor posts you own.",
        metric: `${user?.requestCount ?? 0} active`,
        onPress: () => router.push(APP_ROUTES.PROFILE_REQUESTS),
      },
      {
        id: "bids",
        icon: "pricetag-outline",
        title: "My bids",
        subtitle: "Review offers you placed on nearby requests.",
        metric: `${user?.bidCount ?? 0} pending`,
        onPress: () => router.push(APP_ROUTES.PROFILE_BIDS),
      },
      {
        id: "history",
        icon: "time-outline",
        title: "Activity history",
        subtitle: "Completed requests and bid outcomes.",
        metric: `${user?.completedCount ?? 0} completed`,
        onPress: () => router.push("/profile/activity-history"),
      },
    ],
    [router, user]
  );

  const settingsItems = useMemo<ActionItem[]>(
    () => [
      {
        id: "notifications",
        icon: "notifications-outline",
        title: "Notifications",
        subtitle: "Manage alerts and app updates.",
        onPress: () => router.push(APP_ROUTES.PROFILE_NOTIFICATIONS),
      },
      {
        id: "privacy",
        icon: "shield-checkmark-outline",
        title: "Privacy & security",
        subtitle: "Control visibility and account safety.",
        onPress: () => router.push(APP_ROUTES.PROFILE_PRIVACY),
      },
      {
        id: "support",
        icon: "help-buoy-outline",
        title: "Help & support",
        subtitle: "Report issues or contact support.",
        onPress: () => router.push(APP_ROUTES.PROFILE_SUPPORT),
      },
    ],
    [router]
  );

  const infoItems = useMemo<InfoItem[]>(
    () => [
      {
        label: "Email",
        value: formatLabel(user?.email),
        icon: "mail-outline",
      },
      {
        label: "Phone",
        value: formatPhoneNumberForDisplay(user?.phone),
        icon: "call-outline",
      },
      {
        label: "User type",
        value: formatEnumLabel(user?.userType),
        icon: "accessibility-outline",
      },
      {
        label: "Gender",
        value: formatEnumLabel(user?.gender),
        icon: "person-outline",
      },
      {
        label: "Date of birth",
        value: formatDateLabel(user?.dateOfBirth),
        icon: "calendar-outline",
      },
      {
        label: "Address",
        value: formatCompactAddress(user?.address, "No address added"),
        icon: "location-outline",
      },
    ],
    [user]
  );

  const verificationLabel = user?.isPhoneVerified
    ? "Phone verified"
    : user?.phone
      ? "Phone pending"
      : "Phone missing";

  const handleConfirmLogout = async () => {
    if (loadingLogout) return;

    setLogoutModalVisible(false);

    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          await handleLogout();
          router.replace(APP_ROUTES.AUTH_LOGIN);
        } catch {
          showErrorToast("Logout failed", "Please try again.");
        }
      }, 120);
    });
  };

  return (
    <Screen showsVerticalScrollIndicator={false}>
      <Stack gap="md">
        <View style={styles.screenIntro}>
          <Text style={[styles.eyebrow, { color: palette.primary }]}>
            Account
          </Text>
          <Text style={[styles.screenTitle, { color: palette.textPrimary }]}>
            Profile
          </Text>
          <Text style={[styles.screenSubtitle, { color: palette.textSecondary }]}>
            Keep your community identity, activity, and preferences in sync.
          </Text>
        </View>

        {loading && !user ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
              Loading profile
            </Text>
          </View>
        ) : (
          <Stack gap="md">
            <View style={[styles.hero, { backgroundColor: palette.primaryDark }]}>
              <View
                style={[
                  styles.heroGlow,
                  { backgroundColor: `${palette.primaryLight}24` },
                ]}
              />

              <Row justify="space-between" align="flex-start" style={styles.heroTop}>
                <Pressable
                  onPress={() => setAvatarModalVisible(true)}
                  style={({ pressed }) => [
                    styles.avatarButton,
                    { opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <ProfileAvatar
                    uri={user?.avatarUrl}
                    fullName={user?.fullName}
                    size={92}
                  />
                  <View
                    style={[
                      styles.cameraBadge,
                      {
                        backgroundColor: palette.successSurface,
                        borderColor: palette.primaryDark,
                      },
                    ]}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={15}
                      color={palette.primaryDark}
                    />
                  </View>
                </Pressable>

                <TrustPill
                  icon={
                    user?.isPhoneVerified
                      ? "checkmark-circle"
                      : "alert-circle-outline"
                  }
                  label={verificationLabel}
                  tone={user?.isPhoneVerified ? "success" : "warning"}
                />
              </Row>

              <Stack gap="xs" style={styles.heroCopy}>
                <Text style={[styles.heroName, { color: palette.textInverse }]}>
                  {user?.fullName || "Your profile"}
                </Text>
                <Text style={[styles.heroMeta, { color: `${palette.textInverse}CC` }]}>
                  {user?.email || "No email available"}
                </Text>
                <Text
                  style={[styles.heroBio, { color: `${palette.textInverse}CC` }]}
                  numberOfLines={3}
                >
                  {user?.bio?.trim()
                    ? user.bio
                    : "Add a short bio so neighbors know how you prefer to help and connect."}
                </Text>
              </Stack>

              <View style={styles.heroStatsCompact}>
                <StatChip label="Rating" value={(user?.rating ?? 0).toFixed(1)} />
                <StatChip label="Helps" value={String(user?.helpCount ?? 0)} />
                <StatChip label="Complete" value={`${profileCompleteness}%`} />
              </View>

              <AppButton
                title="Edit profile"
                onPress={() => setEditModalVisible(true)}
                variant="secondary"
              />
            </View>

            <Section title="Profile strength" subtitle="Complete your profile to build more trust with nearby members.">
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${profileCompleteness}%`,
                      backgroundColor: palette.primary,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.completionPercent, { color: palette.textPrimary }]}>
                {profileCompleteness}% complete
              </Text>

              <View style={styles.completionList}>
                {completionItems.map((item) => (
                  <View key={item.label} style={styles.completionItem}>
                    <Ionicons
                      name={item.done ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={item.done ? palette.primary : palette.textSecondary}
                    />
                    <Text
                      style={[
                        styles.completionText,
                        { color: item.done ? palette.textPrimary : palette.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>

            {user?.phone && !user?.isPhoneVerified ? (
              <Pressable
                onPress={() => router.push(APP_ROUTES.AUTH_VERIFY_PHONE)}
                style={({ pressed }) => [
                  styles.verifyBanner,
                  {
                    backgroundColor: palette.warningSoft ?? palette.surfaceMuted,
                    borderColor: palette.warning,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
              >
                <View style={[styles.verifyIcon, { backgroundColor: palette.surface }]}>
                  <Ionicons name="shield-outline" size={20} color={palette.warning} />
                </View>

                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: palette.textPrimary }]}>
                    Verify your phone
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: palette.textSecondary }]}>
                    Confirm your number to unlock a trusted profile badge.
                  </Text>
                </View>

                <Text style={[styles.actionLabel, { color: palette.warning }]}>
                  Verify
                </Text>
              </Pressable>
            ) : null}

            <Section
              title="Activity"
              subtitle="Quick access to your posts, offers, and outcomes."
            >
              {activityItems.map((item, index) => (
                <ActionRow
                  key={item.id}
                  item={item}
                  isLast={index === activityItems.length - 1}
                />
              ))}
            </Section>

            <Section
              title="Profile details"
              subtitle="Information other members use when contacting you."
              action={
                <Pressable onPress={() => setEditModalVisible(true)}>
                  <Text style={[styles.sectionAction, { color: palette.primary }]}>
                    Edit
                  </Text>
                </Pressable>
              }
            >
              <View style={styles.infoList}>
                {infoItems.map((item, index) => (
                  <InfoRow
                    key={item.label}
                    item={item}
                    isLast={index === infoItems.length - 1}
                  />
                ))}
              </View>
            </Section>

            <ThemeModeCard />

            <Section
              title="Settings"
              subtitle="Account controls, notification behavior, and support."
            >
              {settingsItems.map((item, index) => (
                <ActionRow
                  key={item.id}
                  item={item}
                  isLast={index === settingsItems.length - 1}
                />
              ))}
            </Section>

            <Pressable
              style={({ pressed }) => [
                styles.logoutRow,
                {
                  opacity: pressed ? 0.72 : 1,
                  borderColor: palette.border,
                },
              ]}
              onPress={() => setLogoutModalVisible(true)}
              disabled={loadingLogout}
            >
              <Text style={[styles.logoutText, { color: palette.danger }]}>
                {loadingLogout ? "Logging out..." : "Log out"}
              </Text>
              <Ionicons name="log-out-outline" size={20} color={palette.danger} />
            </Pressable>

            {error ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>
                {error}
              </Text>
            ) : null}
          </Stack>
        )}

        <ProfileAvatarPickerModal
          visible={avatarModalVisible}
          onClose={() => setAvatarModalVisible(false)}
        />

        <AppModal
          visible={logoutModalVisible}
          title="Log out"
          onClose={() => {
            if (loadingLogout) return;
            setLogoutModalVisible(false);
          }}
          dismissOnBackdrop={!loadingLogout}
          showCloseButton={false}
          scrollable={false}
          actions={
            <View style={styles.logoutActions}>
              <AppButton
                title="Cancel"
                variant="ghost"
                fullWidth={false}
                onPress={() => setLogoutModalVisible(false)}
                disabled={loadingLogout}
              />
              <AppButton
                title="Log out"
                variant="danger"
                fullWidth={false}
                onPress={handleConfirmLogout}
                loading={loadingLogout}
                disabled={loadingLogout}
              />
            </View>
          }
        >
          <Text style={[styles.logoutModalText, { color: palette.textSecondary }]}>
            Are you sure you want to log out from this device?
          </Text>
        </AppModal>

        <Modal
          visible={editModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <Screen withTabBarSpacing={false}>
            <Stack gap="md">
              <Row justify="space-between" align="center" style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                    Edit profile
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                    Update the details shown on your account.
                  </Text>
                </View>

                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Text style={[styles.closeText, { color: palette.textSecondary }]}>
                    Close
                  </Text>
                </Pressable>
              </Row>

              <ProfileEditForm
                user={user}
                loading={savingProfile}
                onSubmit={async (payload) => {
                  setSavingProfile(true);
                  try {
                    const success = await handleUpdateProfile(payload);
                    if (success) setEditModalVisible(false);
                    return success;
                  } finally {
                    setSavingProfile(false);
                  }
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

const Section = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Row justify="space-between" align="flex-start" gap="sm">
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
        {action}
      </Row>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

const ActionRow = ({ item, isLast }: { item: ActionItem; isLast: boolean }) => {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.actionRow,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
        { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: palette.surfaceMuted }]}>
        <Ionicons name={item.icon} size={19} color={palette.primary} />
      </View>

      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionTitle, { color: palette.textPrimary }]}>
          {item.title}
        </Text>
        <Text style={[styles.actionSubtitle, { color: palette.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>

      <Row gap="xxs" align="center">
        {item.metric ? (
          <Text style={[styles.metricLabel, { color: palette.primary }]}>
            {item.metric}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={17} color={palette.textSecondary} />
      </Row>
    </Pressable>
  );
};

const InfoRow = ({ item, isLast }: { item: InfoItem; isLast: boolean }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.infoRow,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <Row gap="sm" align="center" style={styles.infoLabelWrap}>
        <Ionicons name={item.icon} size={17} color={palette.primary} />
        <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>
          {item.label}
        </Text>
      </Row>

      <Text style={[styles.infoValue, { color: palette.textPrimary }]} numberOfLines={2}>
        {item.value}
      </Text>
    </View>
  );
};

const StatChip = ({ label, value }: { label: string; value: string }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.statChip,
        {
          borderColor: `${palette.textInverse}24`,
          backgroundColor: `${palette.textInverse}12`,
        },
      ]}
    >
      <Text style={[styles.statChipValue, { color: palette.textInverse }]}>
        {value}
      </Text>
      <Text style={[styles.statChipLabel, { color: `${palette.textInverse}B3` }]}>
        {label}
      </Text>
    </View>
  );
};

const TrustPill = ({
  icon,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "success" | "warning";
}) => {
  const { palette } = useThemeContext();
  const backgroundColor =
    tone === "success" ? palette.successSurface : palette.warningSurface;
  const color = tone === "success" ? palette.primary : palette.secondary;

  return (
    <View style={[styles.trustPill, { backgroundColor }]}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.trustPillText, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screenIntro: {
    gap: theme.spacing.xxs,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  screenTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  screenSubtitle: {
    maxWidth: 320,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  loadingWrap: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: theme.radius.xl + 6,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  heroGlow: {
    position: "absolute",
    top: -64,
    right: -52,
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  heroTop: {
    zIndex: 1,
  },
  avatarButton: {
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  heroCopy: {
    zIndex: 1,
  },
  heroName: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroMeta: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  heroBio: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
  },
  heroStatsCompact: {
    zIndex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  statChipValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: "800",
  },
  statChipLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  trustPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "800",
  },
  verifyBanner: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  verifyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  sectionCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  sectionSubtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionAction: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionBody: {
    marginTop: theme.spacing.md,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  completionPercent: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    fontWeight: "800",
  },
  completionList: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  completionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  completionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  actionSubtitle: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  actionLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "800",
  },
  infoList: {
    gap: 0,
  },
  infoRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  infoLabelWrap: {
    flexShrink: 0,
    minWidth: 112,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  logoutRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  modalHeader: {
    paddingTop: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modalSubtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  closeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  logoutActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    width: "100%",
  },
  logoutModalText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
});