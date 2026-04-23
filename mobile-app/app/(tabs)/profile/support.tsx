import React, { useMemo } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Screen, Stack, Row, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type SupportAction = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  label: string;
  tone?: "default" | "warning" | "danger";
  onPress: () => void;
};

type HelpTopic = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || "support@communityhelp.app";

const buildMailtoUrl = ({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const openSupportEmail = async (subject: string, body: string) => {
  const url = buildMailtoUrl({ subject, body });

  try {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert(
        "Email app unavailable",
        `Please email ${SUPPORT_EMAIL} with the subject "${subject}".`
      );
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Could not open email",
      `Please email ${SUPPORT_EMAIL} with the subject "${subject}".`
    );
  }
};

export default function HelpSupportScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const authUser = useAuthStore((state) => state.user);

  const userContext = [
    authUser?.email ? `Account email: ${authUser.email}` : null,
    authUser?.id ? `User ID: ${authUser.id}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const supportActions = useMemo<SupportAction[]>(
    () => [
      {
        id: "contact",
        icon: "mail-outline",
        title: "Contact support",
        subtitle: "Ask about your account, requests, bids, messages, or profile.",
        label: "Email",
        onPress: () =>
          void openSupportEmail(
            "Support request",
            [
              "Hi Community Help team,",
              "",
              "I need help with:",
              "",
              userContext,
            ]
              .filter(Boolean)
              .join("\n")
          ),
      },
      {
        id: "bug",
        icon: "bug-outline",
        title: "Report a problem",
        subtitle: "Send device details, what happened, and steps to reproduce it.",
        label: "Report",
        tone: "warning",
        onPress: () =>
          void openSupportEmail(
            "App issue report",
            [
              "What happened?",
              "",
              "What were you trying to do?",
              "",
              "Steps to reproduce:",
              "1.",
              "2.",
              "3.",
              "",
              userContext,
            ]
              .filter(Boolean)
              .join("\n")
          ),
      },
      {
        id: "safety",
        icon: "shield-outline",
        title: "Report a safety concern",
        subtitle: "Flag suspicious behavior, harassment, or a request that feels unsafe.",
        label: "Report",
        tone: "danger",
        onPress: () =>
          void openSupportEmail(
            "Safety concern",
            [
              "Please describe the safety concern:",
              "",
              "Related request, bid, or conversation:",
              "",
              "People involved:",
              "",
              userContext,
            ]
              .filter(Boolean)
              .join("\n")
          ),
      },
    ],
    [userContext]
  );

  const accountShortcuts = useMemo<SupportAction[]>(
    () => [
      {
        id: "security",
        icon: "lock-closed-outline",
        title: "Account security",
        subtitle: "Change password, verify email or phone, and manage account removal.",
        label: "Open",
        onPress: () => router.push(APP_ROUTES.PROFILE_PRIVACY),
      },
      {
        id: "notifications",
        icon: "notifications-outline",
        title: "Notification settings",
        subtitle: "Choose alerts for messages, bids, request updates, and saved requests.",
        label: "Open",
        onPress: () => router.push(APP_ROUTES.PROFILE_NOTIFICATIONS),
      },
      {
        id: "requests",
        icon: "clipboard-outline",
        title: "Request management",
        subtitle: "Review your posted requests, status changes, and incoming bids.",
        label: "Open",
        onPress: () => router.push(APP_ROUTES.PROFILE_REQUESTS),
      },
    ],
    [router]
  );

  const helpTopics = useMemo<HelpTopic[]>(
    () => [
      {
        id: "request",
        icon: "create-outline",
        title: "Posting a strong request",
        body: "Use a clear title, exact location, timing, budget if relevant, and photos when they help explain the task.",
      },
      {
        id: "bids",
        icon: "pricetag-outline",
        title: "Understanding bids",
        body: "A bid is private until accepted. Compare the message, amount, profile, and reviews before choosing a helper.",
      },
      {
        id: "messages",
        icon: "chatbubble-ellipses-outline",
        title: "Using messages safely",
        body: "Keep coordination in the app when possible and avoid sharing sensitive personal or payment details too early.",
      },
      {
        id: "trust",
        icon: "shield-checkmark-outline",
        title: "Building trust",
        body: "Verify your contact details, add a profile photo, complete requests responsibly, and leave fair reviews.",
      },
    ],
    []
  );

  return (
    <Screen showsVerticalScrollIndicator={false}>
      <AppHeader
        title="Help & support"
        subtitle="Get guidance, contact support, and report issues from one place."
        showBackButton
        backButtonProps={{
          fallback: APP_ROUTES.PROFILE,
          variant: "secondary",
        }}
      />

      <Stack gap="md">
        <View style={[styles.hero, { backgroundColor: palette.primaryDark }]}>
          <View style={styles.heroGlow} />
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy-outline" size={26} color={palette.primaryDark} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroCopy}>
            Start with common account actions below, or email support with context already
            prepared for your account.
          </Text>
        </View>

        <View
          style={[
            styles.safetyBanner,
            {
              backgroundColor: palette.dangerSoft,
              borderColor: palette.danger,
            },
          ]}
        >
          <Ionicons name="warning-outline" size={20} color={palette.danger} />
          <View style={styles.bannerCopy}>
            <Text style={[styles.bannerTitle, { color: palette.danger }]}>
              Immediate danger
            </Text>
            <Text style={[styles.bannerText, { color: palette.textSecondary }]}>
              If anyone is in immediate danger, contact local emergency services first.
              Support reports are not monitored as emergency dispatch.
            </Text>
          </View>
        </View>

        <SupportSection
          title="Contact us"
          subtitle="Choose the closest reason so your email starts with the right context."
        >
          {supportActions.map((item, index) => (
            <SupportRow
              key={item.id}
              item={item}
              isLast={index === supportActions.length - 1}
            />
          ))}
        </SupportSection>

        <SupportSection
          title="Quick account help"
          subtitle="Jump directly to the settings most support questions need."
        >
          {accountShortcuts.map((item, index) => (
            <SupportRow
              key={item.id}
              item={item}
              isLast={index === accountShortcuts.length - 1}
            />
          ))}
        </SupportSection>

        <SupportSection
          title="Guides"
          subtitle="Short answers for common community help workflows."
        >
          <View style={styles.topicGrid}>
            {helpTopics.map((topic) => (
              <HelpTopicCard key={topic.id} topic={topic} />
            ))}
          </View>
        </SupportSection>

        <View
          style={[
            styles.footerPanel,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.footerTitle, { color: palette.textPrimary }]}>
            Support email
          </Text>
          <Text style={[styles.footerText, { color: palette.textSecondary }]}>
            {SUPPORT_EMAIL}
          </Text>
        </View>
      </Stack>
    </Screen>
  );
}

const SupportSection = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
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
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
        {subtitle}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

const SupportRow = ({ item, isLast }: { item: SupportAction; isLast: boolean }) => {
  const { palette } = useThemeContext();
  const color =
    item.tone === "danger"
      ? palette.danger
      : item.tone === "warning"
        ? palette.warning
        : palette.primary;
  const backgroundColor =
    item.tone === "danger"
      ? palette.dangerSoft
      : item.tone === "warning"
        ? palette.warningSoft ?? palette.surfaceMuted
        : palette.surfaceMuted;

  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.supportRow,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
        { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor }]}>
        <Ionicons name={item.icon} size={19} color={color} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: palette.textPrimary }]}>
          {item.title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: palette.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>
      <Row gap="xxs" align="center">
        <Text style={[styles.rowLabel, { color }]}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={17} color={color} />
      </Row>
    </Pressable>
  );
};

const HelpTopicCard = ({ topic }: { topic: HelpTopic }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.topicCard,
        {
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons name={topic.icon} size={19} color={palette.primary} />
      <Text style={[styles.topicTitle, { color: palette.textPrimary }]}>
        {topic.title}
      </Text>
      <Text style={[styles.topicBody, { color: palette.textSecondary }]}>
        {topic.body}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: theme.radius.xl + 6,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  heroGlow: {
    position: "absolute",
    top: -58,
    right: -48,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(223,236,229,0.14)",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECF4EF",
  },
  heroTitle: {
    color: "#F4F1EA",
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroCopy: {
    maxWidth: 330,
    color: "rgba(242,238,230,0.78)",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
  },
  safetyBanner: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  bannerCopy: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  bannerText: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  section: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
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
  sectionBody: {
    marginTop: theme.spacing.md,
  },
  supportRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  rowLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  topicCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minHeight: 150,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  topicTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  topicBody: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  footerPanel: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  footerTitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  footerText: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
