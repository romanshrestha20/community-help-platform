import React, { useEffect, useRef } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { Card, Stack, theme } from "@/design-system";
import {
  AuthBanner,
  AuthCard,
  AuthHero,
  AuthScreen,
} from "@/features/auth/components";
import { APP_ROUTES } from "@/config/routes";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useUser } from "@/features/user/hooks/user.hook";

export default function WelcomeScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const authUser = useAuthStore((state) => state.user);
  const { role, interestIds, pendingAvatar, firstName, reset } = useOnboardingStore();
  const { loading, handleUploadAvatar } = useUser();
  const hasUploadedAvatarRef = useRef(false);

  const displayName =
    firstName ||
    authUser?.fullName?.split(" ")[0] ||
    authUser?.profile?.fullName?.split(" ")[0] ||
    "friend";

  useEffect(() => {
    if (!pendingAvatar || hasUploadedAvatarRef.current) {
      return;
    }

    hasUploadedAvatarRef.current = true;
    void handleUploadAvatar(pendingAvatar).finally(() => {
      useOnboardingStore.getState().setPendingAvatar(null);
    });
  }, [handleUploadAvatar, pendingAvatar]);

  const roleLabel =
    role === "HELPER" ? "Helper" : role === "REQUESTER" ? "Requester" : "Helper + Requester";

  return (
    <AuthScreen>
      <AuthHero
        icon="sparkles-outline"
        eyebrow="Setup complete"
        title={`You're all set, ${displayName}!`}
        subtitle="Your account is ready. Start by posting a request, browsing nearby opportunities, or verifying your phone for extra trust."
      />

      <AuthCard>
        <Stack gap="md">
          {pendingAvatar || loading ? (
            <AuthBanner tone="info">
              Finishing your profile photo setup in the background.
            </AuthBanner>
          ) : null}

          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryTile,
                {
                  backgroundColor: palette.surfaceSecondary,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                Role
              </Text>
              <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                {roleLabel}
              </Text>
            </View>

            <View
              style={[
                styles.summaryTile,
                {
                  backgroundColor: palette.surfaceSecondary,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: palette.textSecondary }]}>
                Interests
              </Text>
              <Text style={[styles.summaryValue, { color: palette.textPrimary }]}>
                {interestIds.length}
              </Text>
            </View>
          </View>

          {!authUser?.isPhoneVerified ? (
            <AuthBanner tone="info">
              Verify your phone number to increase trust when you request or offer help.
            </AuthBanner>
          ) : null}

          <View style={styles.quickActionRow}>
            <Pressable
              onPress={() => {
                reset();
                router.replace("/(tabs)/home");
              }}
              style={[
                styles.quickActionCard,
                {
                  backgroundColor: palette.surfaceSecondary,
                  borderColor: palette.border,
                },
              ]}
            >
              <Ionicons name="add-circle-outline" size={22} color={palette.primary} />
              <Text style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Post a request
              </Text>
              <Text style={[styles.quickActionCopy, { color: palette.textSecondary }]}>
                Start asking for help right away.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                reset();
                router.replace("/(tabs)/home/requests");
              }}
              style={[
                styles.quickActionCard,
                {
                  backgroundColor: palette.surfaceSecondary,
                  borderColor: palette.border,
                },
              ]}
            >
              <Ionicons name="search-outline" size={22} color={palette.primary} />
              <Text style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Browse requests
              </Text>
              <Text style={[styles.quickActionCopy, { color: palette.textSecondary }]}>
                See what people nearby need.
              </Text>
            </Pressable>
          </View>

          {!authUser?.isPhoneVerified ? (
            <AppButton
              title="Verify phone for trust"
              variant="secondary"
              onPress={() => router.push(APP_ROUTES.AUTH_VERIFY_PHONE)}
            />
          ) : null}

          <AppButton
            title="Go to home"
            onPress={() => {
              reset();
              router.replace("/(tabs)/home");
            }}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  summaryTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  quickActionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  quickActionCopy: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
});
