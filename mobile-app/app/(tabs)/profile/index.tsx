// app/(tabs)/profile/index.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";

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
  VerificationBadgeList,
} from "@/features/user/components/";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { useUser } from "@/features/user/hooks/user.hook";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import type { HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { useReviews } from "@/features/reviews/hooks/useReviews";
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

const truncateEmail = (value?: string | null) => {
  if (!value) return "Not set";
  if (value.length <= 26) return value;
  return `${value.slice(0, 24)}...`;
};

export default function ProfileTabScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1200;
  const { palette } = useThemeContext();
  const router = useRouter();
  const pathname = usePathname();
  const { handleLogout, loadingLogout } = useAuth();
  const { user, loading, error, loadUserProfile, handleUpdateProfile } =
    useUser();

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState<"ALL" | HelpRequestStatus>("ALL");
  const [reviewLoading, setReviewLoading] = useState(false);

  const { requests } = useRequestList({ scope: "mine" });
  const { getUserReviews, getCachedReviews } = useReviews();

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
        label: "Profile photo added",
        done: Boolean(user?.avatarUrl),
      },
      {
        label: "Phone verified",
        done: Boolean(user?.isPhoneVerified),
      },
      {
        label: "Bio added",
        done: Boolean(user?.bio?.trim()),
      },
      {
        label: "Address added",
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
        onPress: () => router.push(APP_ROUTES.PROFILE_REQUESTS),
      },
      {
        id: "bids",
        icon: "pricetag-outline",
        title: "My bids",
        subtitle: "Review offers you placed on nearby requests.",
        onPress: () => router.push(APP_ROUTES.PROFILE_BIDS),
      },
      {
        id: "history",
        icon: "time-outline",
        title: "Activity history",
        subtitle: "Completed requests and bid outcomes.",
        metric:
          user?.helpCount && user.helpCount > 0
            ? `${user.helpCount} helped`
            : undefined,
        onPress: () => router.push("/profile/activity-history"),
      },
      {
        id: "saved",
        icon: "bookmark-outline",
        title: "Saved requests",
        subtitle: "Requests you bookmarked to revisit later.",
        onPress: () => router.push(APP_ROUTES.FAVORITES),
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
        value: truncateEmail(user?.email),
        icon: "mail-outline",
      },
      {
        label: "Phone",
        value: formatPhoneNumberForDisplay(user?.phone),
        icon: "call-outline",
      },
      {
        label: "Location",
        value: formatCompactAddress(user?.address, "No address added"),
        icon: "location-outline",
      },
      {
        label: "Bio",
        value: formatLabel(user?.bio),
        icon: "document-text-outline",
      },
    ],
    [user]
  );

  const primarySkills = useMemo(
    () => (user?.skills ?? []).filter((skill) => skill.isPrimary),
    [user?.skills]
  );

  const approvedCertifications = useMemo(
    () =>
      (user?.certifications ?? []).filter(
        (certification) => certification.status === "APPROVED"
      ),
    [user?.certifications]
  );

  const filteredRequests = useMemo(() => {
    const query = requestSearch.trim().toLowerCase();

    return requests
      .filter((request) => {
        if (requestStatus !== "ALL" && request.status !== requestStatus) return false;
        if (!query) return true;
        const haystack = `${request.title} ${request.description} ${request.category?.name ?? ""}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 5);
  }, [requestSearch, requestStatus, requests]);

  const profileTabs = useMemo(
    () => [
      { label: "My Requests", href: APP_ROUTES.PROFILE_REQUESTS, isActive: pathname === APP_ROUTES.PROFILE || pathname === APP_ROUTES.PROFILE_REQUESTS || pathname.startsWith(`${APP_ROUTES.PROFILE_REQUESTS}/`) },
      { label: "My Bids", href: APP_ROUTES.PROFILE_BIDS, isActive: pathname === APP_ROUTES.PROFILE_BIDS || pathname.startsWith(`${APP_ROUTES.PROFILE_BIDS}/`) },
      { label: "Saved Requests", href: APP_ROUTES.FAVORITES, isActive: pathname === APP_ROUTES.FAVORITES || pathname.startsWith(`${APP_ROUTES.FAVORITES}/`) },
      { label: "Reviews", href: "/profile/activity-history?tab=reviews", isActive: pathname === "/profile/activity-history" && false },
      { label: "Activity", href: "/profile/activity-history?tab=requests", isActive: pathname === "/profile/activity-history" },
  ],
    [pathname]
  );

  useEffect(() => {
    if (!isDesktopWeb || !user?.id) return;

    let cancelled = false;
    setReviewLoading(true);

    void getUserReviews(user.id, { limit: 5, forceRefresh: true })
      .finally(() => {
        if (!cancelled) {
          setReviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getUserReviews, isDesktopWeb, user?.id]);

  const recentReviews = useMemo(
    () =>
      (user?.id ? getCachedReviews(user.id) : [])
        .slice(0, 3)
        .map((review) => ({
          id: review.id,
          name: review.reviewer.fullName || "Community member",
          comment: review.comment || review.title || "No comment provided.",
          stars: "★".repeat(Math.max(1, Math.round(review.rating))),
          when: new Date(review.createdAt).toLocaleDateString(),
        })),
    [getCachedReviews, user?.id]
  );

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

  const content = (
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
                    size={82}
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
                  numberOfLines={2}
                >
                  {user?.bio?.trim()
                    ? user.bio
                    : "Add a short bio so neighbors know how you prefer to help and connect."}
                </Text>
                <VerificationBadgeList badges={user?.verificationBadges} />
              </Stack>

              <View style={styles.heroStatsCompact}>
                <StatChip label="Rating" value={(user?.rating ?? 0).toFixed(1)} />
                <StatChip label="Helps" value={String(user?.helpCount ?? 0)} />
                <StatChip
                  label="Verified"
                  value={user?.isEmailVerified ? "Email" : "Pending"}
                />
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
                        { color: item.done ? palette.textSecondary : palette.textPrimary },
                      ]}
                    >
                      {item.done ? `${item.label}` : item.label}
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
                  Verify now
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
              subtitle="Useful contact and identity details for your profile."
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

            <Section
              title="Qualifications"
              subtitle="Skills, experience, and approved certifications shown to requesters."
              action={
                <Pressable onPress={() => setEditModalVisible(true)}>
                  <Text style={[styles.sectionAction, { color: palette.primary }]}>
                    Edit
                  </Text>
                </Pressable>
              }
            >
              <Stack gap="md">
                <View style={styles.qualificationGroup}>
                  <Text style={[styles.qualificationLabel, { color: palette.textSecondary }]}>
                    Skills
                  </Text>
                  <View style={styles.qualificationChips}>
                    {(primarySkills.length > 0 ? primarySkills : user?.skills ?? []).map((skill) => (
                      <View
                        key={skill.id}
                        style={[
                          styles.qualificationChip,
                          {
                            backgroundColor: skill.isPrimary
                              ? palette.primarySoft
                              : palette.surfaceMuted,
                            borderColor: skill.isPrimary ? palette.primary : palette.border,
                          },
                        ]}
                      >
                        <Text style={[styles.qualificationChipTitle, { color: palette.textPrimary }]}>
                          {skill.skill?.name || "Skill"}
                        </Text>
                        <Text style={[styles.qualificationChipMeta, { color: palette.textSecondary }]}>
                          {formatEnumLabel(skill.experienceLevel)}
                        </Text>
                      </View>
                    ))}
                    {(!user?.skills || user.skills.length === 0) ? (
                      <Text style={[styles.emptyQualificationText, { color: palette.textSecondary }]}>
                        Add skills to improve trust and conversion.
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.qualificationGroup}>
                  <Text style={[styles.qualificationLabel, { color: palette.textSecondary }]}>
                    Approved certifications
                  </Text>
                  <Stack gap="sm">
                    {approvedCertifications.map((certification) => (
                      <View
                        key={certification.id}
                        style={[
                          styles.certificationRow,
                          {
                            backgroundColor: palette.surfaceMuted,
                            borderColor: palette.border,
                          },
                        ]}
                      >
                        <Text style={[styles.certificationRowTitle, { color: palette.textPrimary }]}>
                          {certification.name}
                        </Text>
                        <Text style={[styles.certificationRowMeta, { color: palette.textSecondary }]}>
                          {certification.issuer}
                        </Text>
                      </View>
                    ))}
                    {approvedCertifications.length === 0 ? (
                      <Text style={[styles.emptyQualificationText, { color: palette.textSecondary }]}>
                        No approved certifications yet.
                      </Text>
                    ) : null}
                  </Stack>
                </View>
              </Stack>
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

        {isDesktopWeb ? (
          <AppModal
            visible={editModalVisible}
            title="Edit profile"
            onClose={() => setEditModalVisible(false)}
            showCloseButton
            scrollable
            size="xl"
          >
            <ProfileEditForm
              user={user}
              loading={savingProfile}
              onSubmit={async (payload) => {
                setSavingProfile(true);
                try {
                  const result = await handleUpdateProfile(payload);
                  if (result.success) setEditModalVisible(false);
                  return result;
                } finally {
                  setSavingProfile(false);
                }
              }}
              onCancel={() => setEditModalVisible(false)}
            />
          </AppModal>
        ) : (
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
                      const result = await handleUpdateProfile(payload);
                      if (result.success) setEditModalVisible(false);
                      return result;
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                  onCancel={() => setEditModalVisible(false)}
                />
              </Stack>
            </Screen>
          </Modal>
        )}
      </Stack>
    </Screen>
  );

  if (isDesktopWeb) {
    return (
      <WebSectionShell
        activeKey="profile"
        rightPanelWidth={348}
        rightPanel={
          <Stack gap="sm">
            <View style={[styles.railCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <Row justify="space-between" align="center">
                <Text style={[styles.railTitle, { color: palette.textPrimary }]}>Profile completion</Text>
                <Text style={[styles.railValue, { color: palette.textPrimary }]}>{profileCompleteness}%</Text>
              </Row>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${profileCompleteness}%`, backgroundColor: palette.primary }]} />
              </View>
              <Text style={[styles.railCopy, { color: palette.textSecondary }]}>
                Complete your profile for better response quality.
              </Text>
              <AppButton title={profileCompleteness >= 100 ? "Edit profile" : "Complete profile"} onPress={() => setEditModalVisible(true)} />
            </View>

            <View style={[styles.railCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <Text style={[styles.railTitle, { color: palette.textPrimary }]}>Account summary</Text>
              <View style={styles.summaryGrid}>
                <SummaryCell label="Total requests" value={String(requests.length)} />
                <SummaryCell label="Active requests" value={String(requests.filter((item) => item.status === "OPEN").length)} />
                <SummaryCell label="Completed" value={String(requests.filter((item) => item.status === "COMPLETED").length)} />
                <SummaryCell label="Response rate" value={requests.length ? `${Math.round((requests.filter((item) => item.status !== "CANCELLED").length / requests.length) * 100)}%` : "0%"} />
              </View>
            </View>

            <View style={[styles.railCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <Row justify="space-between" align="center">
                <Text style={[styles.railTitle, { color: palette.textPrimary }]}>Recent reviews</Text>
                <Pressable onPress={() => router.push("/profile/activity-history")}>
                  <Text style={[styles.railLink, { color: palette.primary }]}>View all</Text>
                </Pressable>
              </Row>
              {reviewLoading && recentReviews.length === 0 ? (
                <Text style={[styles.reviewComment, { color: palette.textSecondary }]}>Loading reviews...</Text>
              ) : recentReviews.length === 0 ? (
                <Text style={[styles.reviewComment, { color: palette.textSecondary }]}>No reviews yet.</Text>
              ) : (
                <Stack gap="xs">
                {recentReviews.map((review) => (
                  <View key={review.id} style={[styles.reviewRow, { borderColor: palette.border }]}>
                    <Text style={[styles.reviewName, { color: palette.textPrimary }]}>{review.name}</Text>
                    <Text style={[styles.reviewStars, { color: palette.warning }]}>{review.stars}</Text>
                    <Text style={[styles.reviewComment, { color: palette.textSecondary }]} numberOfLines={2}>{review.comment}</Text>
                    <Text style={[styles.reviewWhen, { color: palette.textMuted }]}>{review.when}</Text>
                  </View>
                ))}
              </Stack>
              )}
            </View>

            <View style={[styles.railCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <Text style={[styles.railTitle, { color: palette.textPrimary }]}>Trust & verification</Text>
              <Stack gap="xs">
                <TrustItem label="Email verified" checked={Boolean(user?.isEmailVerified)} />
                <TrustItem label="Phone verified" checked={Boolean(user?.isPhoneVerified)} />
                <TrustItem label="ID verified" checked={Boolean(user?.verificationBadges?.length)} />
                <TrustItem label="Trusted member" checked />
              </Stack>
            </View>
          </Stack>
        }
      >
        <View style={styles.desktopProfileContent}>
          <View style={[styles.desktopHero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Row gap="md" align="center">
              <ProfileAvatar uri={user?.avatarUrl} fullName={user?.fullName} size={86} />
              <Stack gap="xxs" style={{ flex: 1 }}>
                <Row gap="xs" align="center">
                  <Text style={[styles.desktopHeroName, { color: palette.textPrimary }]}>{user?.fullName || "Roman Shrestha"}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={palette.primary} />
                </Row>
                <Row gap="sm" align="center">
                  <Text style={[styles.desktopHeroMeta, { color: palette.textSecondary }]}>{formatCompactAddress(user?.address, "Helsinki, Finland")}</Text>
                  <Text style={[styles.desktopHeroMeta, { color: palette.textSecondary }]}>Member since Apr 2024</Text>
                </Row>
                <View style={styles.desktopBadgeRow}>
                  {Boolean(user?.isEmailVerified) ? <BadgePill label="Email verified" /> : null}
                  {Boolean(user?.isPhoneVerified) ? <BadgePill label="Phone verified" /> : null}
                  {Boolean(user?.verificationBadges?.length) ? <BadgePill label="ID verified" /> : null}
                </View>
              </Stack>
              <View style={styles.desktopHeroStats}>
                <Text style={[styles.desktopStatValue, { color: palette.textPrimary }]}>{(user?.rating ?? 4.8).toFixed(1)}</Text>
                <Text style={[styles.desktopStatLabel, { color: palette.textSecondary }]}>Average rating</Text>
              </View>
              <View style={styles.desktopHeroStats}>
                <Text style={[styles.desktopStatValue, { color: palette.textPrimary }]}>{user?.helpCount ?? 12}</Text>
                <Text style={[styles.desktopStatLabel, { color: palette.textSecondary }]}>Completed helps</Text>
              </View>
            </Row>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileTabRow}>
            {profileTabs.map((tab) => {
              return (
              <Pressable
                key={tab.label}
                onPress={() => router.push(tab.href as never)}
                style={[
                  styles.profileTabPill,
                  {
                    borderColor: tab.isActive ? palette.primary : palette.border,
                    backgroundColor: tab.isActive ? palette.primarySoft : palette.surface,
                  },
                ]}
              >
                <Text style={[styles.profileTabPillText, { color: tab.isActive ? palette.primary : palette.textSecondary }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
            })}
          </ScrollView>

          <View style={[styles.requestsTableCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Row justify="space-between" align="center" style={styles.requestsTableToolbar}>
              <Text style={[styles.requestsTableTitle, { color: palette.textPrimary }]}>My Requests</Text>
              <View style={styles.requestsTableTools}>
                <View style={[styles.requestsSearch, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
                  <Ionicons name="search-outline" size={16} color={palette.textSecondary} />
                  <TextInput
                    placeholder="Search my requests..."
                    placeholderTextColor={palette.textMuted}
                    value={requestSearch}
                    onChangeText={setRequestSearch}
                    style={[styles.requestsSearchInput, { color: palette.textPrimary }]}
                  />
                </View>
                <View style={styles.statusChipRow}>
                  {(["ALL", "OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"] as const).map((status) => {
                    const active = requestStatus === status;
                    return (
                      <Pressable
                        key={status}
                        onPress={() => setRequestStatus(status)}
                        style={[
                          styles.statusSelect,
                          {
                            borderColor: active ? palette.primary : palette.border,
                            backgroundColor: active ? palette.primarySoft : palette.surfaceMuted,
                          },
                        ]}
                      >
                        <Text style={[styles.statusSelectText, { color: active ? palette.primary : palette.textPrimary }]}>
                          {status === "ALL" ? "All Status" : status}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Row>
            <View style={[styles.tableHeader, { borderColor: palette.border }]}>
              <Text style={[styles.thRequest, { color: palette.textMuted }]}>Request</Text>
              <Text style={[styles.thCategory, { color: palette.textMuted }]}>Category</Text>
              <Text style={[styles.thLocation, { color: palette.textMuted }]}>Location</Text>
              <Text style={[styles.thBudget, { color: palette.textMuted }]}>Budget</Text>
              <Text style={[styles.thStatus, { color: palette.textMuted }]}>Status</Text>
              <Text style={[styles.thDate, { color: palette.textMuted }]}>Date</Text>
              <Text style={[styles.thAction, { color: palette.textMuted }]}>Action</Text>
            </View>
            <Stack gap="xxs">
              {filteredRequests.map((request) => (
                <View key={request.id} style={[styles.tableRow, { borderColor: palette.border }]}>
                  <View style={styles.requestCell}>
                    <Text style={[styles.requestTitle, { color: palette.textPrimary }]} numberOfLines={1}>{request.title}</Text>
                    <Text style={[styles.requestDesc, { color: palette.textSecondary }]} numberOfLines={1}>{request.description}</Text>
                  </View>
                  <Text style={[styles.tdCategory, { color: palette.textPrimary }]} numberOfLines={1}>{request.category?.name || "General"}</Text>
                  <Text style={[styles.tdLocation, { color: palette.textPrimary }]} numberOfLines={1}>{request.city || "Helsinki"}</Text>
                  <Text style={[styles.tdBudget, { color: palette.textPrimary }]}>€{request.budget ?? 0}</Text>
                  <View style={styles.tdStatus}><StatusBadge status={request.status} /></View>
                  <Text style={[styles.tdDate, { color: palette.textSecondary }]}>{new Date(request.createdAt).toLocaleDateString()}</Text>
                  <Pressable style={[styles.viewButton, { borderColor: palette.border }]} onPress={() => router.push(APP_ROUTES.PROFILE_REQUEST_DETAILS(request.id))}>
                    <Text style={[styles.viewButtonText, { color: palette.textPrimary }]}>View</Text>
                  </Pressable>
                </View>
              ))}
            </Stack>
            <Text style={[styles.tableFooter, { color: palette.textMuted }]}>
              Showing 1 to {filteredRequests.length} of {requests.length} requests
            </Text>
          </View>
          <ProfileAvatarPickerModal
            visible={avatarModalVisible}
            onClose={() => setAvatarModalVisible(false)}
          />

          <AppModal
            visible={editModalVisible}
            title="Edit profile"
            onClose={() => setEditModalVisible(false)}
            showCloseButton
            scrollable
            size="xl"
          >
            <ProfileEditForm
              user={user}
              loading={savingProfile}
              onSubmit={async (payload) => {
                setSavingProfile(true);
                try {
                  const result = await handleUpdateProfile(payload);
                  if (result.success) setEditModalVisible(false);
                  return result;
                } finally {
                  setSavingProfile(false);
                }
              }}
              onCancel={() => setEditModalVisible(false)}
            />
          </AppModal>

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
        </View>
      </WebSectionShell>
    );
  }

  return content;
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

const SummaryCell = ({ label, value }: { label: string; value: string }) => {
  const { palette } = useThemeContext();
  return (
    <View style={[styles.summaryCell, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
      <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>{label}</Text>
    </View>
  );
};

const TrustItem = ({ label, checked }: { label: string; checked: boolean }) => {
  const { palette } = useThemeContext();
  return (
    <Row gap="xs" align="center">
      <Ionicons
        name={checked ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={checked ? palette.primary : palette.textSecondary}
      />
      <Text style={[styles.trustLabel, { color: palette.textSecondary }]}>{label}</Text>
    </Row>
  );
};

const BadgePill = ({ label }: { label: string }) => {
  const { palette } = useThemeContext();
  return (
    <View style={[styles.desktopBadgePill, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
      <Text style={[styles.desktopBadgeText, { color: palette.textPrimary }]}>{label}</Text>
    </View>
  );
};

const StatusBadge = ({ status }: { status: HelpRequestStatus }) => {
  const { palette } = useThemeContext();
  const tone =
    status === "OPEN"
      ? { bg: palette.successSurface, fg: palette.success }
      : status === "ASSIGNED"
        ? { bg: palette.primarySoft, fg: palette.primary }
        : status === "COMPLETED"
          ? { bg: palette.surfaceMuted, fg: palette.success }
          : { bg: palette.dangerSoft, fg: palette.danger };
  return (
    <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.statusBadgeText, { color: tone.fg }]}>{status}</Text>
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
    padding: theme.spacing.md,
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
  qualificationGroup: {
    gap: theme.spacing.sm,
  },
  qualificationLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  qualificationChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  qualificationChip: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xxs,
  },
  qualificationChipTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  qualificationChipMeta: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  certificationRow: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  certificationRowTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  certificationRowMeta: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  emptyQualificationText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
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
  webPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  webPanelTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  webPanelBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  desktopProfileContent: {
    gap: theme.spacing.sm,
  },
  desktopHero: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  desktopHeroName: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  desktopHeroMeta: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  desktopBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  desktopBadgePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  desktopBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  desktopHeroStats: {
    minWidth: 120,
    alignItems: "flex-start",
    gap: 4,
  },
  desktopStatValue: {
    fontSize: 36,
    fontWeight: "800",
  },
  desktopStatLabel: {
    fontSize: theme.typography.fontSize.sm,
  },
  profileTabRow: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.md,
  },
  profileTabPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  profileTabPillText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  requestsTableCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  requestsTableTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "800",
  },
  requestsTableToolbar: {
    flexWrap: "wrap",
    rowGap: theme.spacing.xs,
    columnGap: theme.spacing.sm,
  },
  requestsTableTools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    flex: 1,
    gap: theme.spacing.xs,
  },
  statusChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "flex-start",
    flexShrink: 1,
  },
  requestsSearch: {
    minWidth: 220,
    maxWidth: 360,
    flexGrow: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestsSearchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  statusSelect: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  statusSelectText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  tableHeader: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  thRequest: {
    flex: 2.2,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  thMeta: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  thCategory: {
    width: 100,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  thLocation: {
    width: 94,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  thBudget: {
    width: 88,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  thStatus: {
    width: 104,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  thDate: {
    width: 92,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  thAction: {
    width: 72,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    textAlign: "right",
  },
  tableRow: {
    borderBottomWidth: 1,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  requestCell: {
    flex: 2.2,
    paddingRight: 8,
  },
  requestTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  requestDesc: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.xs,
  },
  tdMeta: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
  },
  tdCategory: {
    width: 100,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
    paddingHorizontal: 6,
  },
  tdLocation: {
    width: 94,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
    paddingHorizontal: 6,
  },
  tdBudget: {
    width: 88,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
    paddingHorizontal: 6,
  },
  tdStatus: {
    width: 104,
    paddingHorizontal: 6,
    alignItems: "flex-start",
  },
  tdDate: {
    width: 92,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
    paddingHorizontal: 6,
  },
  statusBadge: {
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 96,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  viewButton: {
    width: 72,
    height: 32,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  viewButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  tableFooter: {
    fontSize: theme.typography.fontSize.xs,
    paddingTop: theme.spacing.xs,
  },
  railCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  railTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "800",
  },
  railValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "800",
  },
  railCopy: {
    fontSize: theme.typography.fontSize.sm,
  },
  railLink: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  summaryCell: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 12,
    padding: theme.spacing.sm,
    gap: 4,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
  },
  reviewRow: {
    borderTopWidth: 1,
    paddingTop: theme.spacing.sm,
    gap: 2,
  },
  reviewName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  reviewStars: {
    fontSize: theme.typography.fontSize.xs,
  },
  reviewComment: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs + 2,
  },
  reviewWhen: {
    fontSize: theme.typography.fontSize.xs,
  },
  trustLabel: {
    fontSize: theme.typography.fontSize.sm,
  },
});
