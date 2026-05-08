import React, { useEffect, useMemo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Screen, Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useLoginActivity } from "../hooks/useLoginActivity";
import type { LoginSession } from "../types/security.types";

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getSessionLabel = (session: LoginSession) => {
  const primary = session.deviceName?.trim()
    || session.browser?.trim()
    || "Unknown device";

  const secondary = [session.platform, session.appVersion]
    .filter(Boolean)
    .join(" · ");

  return secondary ? `${primary} · ${secondary}` : primary;
};

const loginMethodLabel = (method: LoginSession["loginMethod"]) =>
  method === "GOOGLE" ? "Google" : "Email + password";

export const LoginActivityScreen = () => {
  const { palette } = useThemeContext();
  const {
    currentSession,
    otherSessions,
    loading,
    refreshing,
    error,
    mutatingSessionId,
    loggingOutOthers,
    refetch,
    revokeSession,
    logoutOtherSessions,
  } = useLoginActivity();

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const empty = useMemo(() => !loading && otherSessions.length === 0, [loading, otherSessions.length]);
  const hasOtherSessions = otherSessions.length > 0;

  const confirmOnWeb = (title: string, message: string) => {
    if (Platform.OS !== "web") return true;
    if (typeof window === "undefined" || typeof window.confirm !== "function") return false;
    return window.confirm(`${title}\n\n${message}`);
  };

  const confirmRevoke = (session: LoginSession) => {
    const title = "Log out this device?";
    const message = `This will end access on ${getSessionLabel(session)}.`;

    if (Platform.OS === "web") {
      if (!confirmOnWeb(title, message)) return;
      void (async () => {
        const result = await revokeSession(session.id);
        if (!result.success) {
          showErrorToast("Could not log out device", result.message);
          return;
        }
        showSuccessToast("Device logged out", result.message);
      })();
      return;
    }

    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            const result = await revokeSession(session.id);
            if (!result.success) {
              showErrorToast("Could not log out device", result.message);
              return;
            }
            showSuccessToast("Device logged out", result.message);
          },
        },
      ]
    );
  };

  const confirmLogoutOthers = () => {
    const title = "Log out all other devices?";
    const message = "Your current device will stay signed in. All other sessions will be removed.";

    if (Platform.OS === "web") {
      if (!confirmOnWeb(title, message)) return;
      void (async () => {
        const result = await logoutOtherSessions();
        if (!result.success) {
          showErrorToast("Could not log out other devices", result.message);
          return;
        }
        showSuccessToast("Other devices logged out", result.message);
      })();
      return;
    }

    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out others",
          style: "destructive",
          onPress: async () => {
            const result = await logoutOtherSessions();
            if (!result.success) {
              showErrorToast("Could not log out other devices", result.message);
              return;
            }
            showSuccessToast("Other devices logged out", result.message);
          },
        },
      ]
    );
  };

  const SessionCard = ({ session, current = false }: { session: LoginSession; current?: boolean }) => (
    <Card>
      <Stack gap="xs">
        <View style={styles.rowBetween}>
          <Text style={[styles.deviceTitle, { color: palette.textPrimary }]}>
            {current ? "This device" : getSessionLabel(session)}
          </Text>
          {current ? (
            <View style={[styles.currentPill, { backgroundColor: `${palette.success}20` }]}>
              <Text style={[styles.currentPillText, { color: palette.success }]}>Current</Text>
            </View>
          ) : null}
        </View>

        {current ? (
          <Text style={[styles.detailText, { color: palette.textSecondary }]}>
            {getSessionLabel(session)}
          </Text>
        ) : null}

        <Text style={[styles.detailText, { color: palette.textSecondary }]}>
          {session.locationLabel || "Location unavailable"}
        </Text>
        <Text style={[styles.detailText, { color: palette.textSecondary }]}>
          IP {session.ipAddress || "hidden"}
        </Text>
        <Text style={[styles.detailText, { color: palette.textSecondary }]}>
          Last active {formatRelativeTime(session.lastActiveAt)}
        </Text>
        <Text style={[styles.detailText, { color: palette.textSecondary }]}>
          Signed in with {loginMethodLabel(session.loginMethod)}
        </Text>

        {!current ? (
          <AppButton
            title="Log out device"
            variant="secondary"
            onPress={() => confirmRevoke(session)}
            loading={mutatingSessionId === session.id}
            disabled={Boolean(mutatingSessionId)}
          />
        ) : null}
      </Stack>
    </Card>
  );

  return (
    <Screen>
      <AppHeader
        title="Login activity"
        subtitle="Manage devices where your account is signed in."
        showBackButton
        backButtonProps={{
          fallback: APP_ROUTES.PROFILE_PRIVACY,
          variant: "secondary",
        }}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refetch(true);
            }}
            tintColor={palette.primary}
          />
        }
      >
        <Stack gap="md">
          {loading ? (
            <Card>
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={palette.primary} />
                <Text style={[styles.detailText, { color: palette.textSecondary }]}>
                  Loading sessions...
                </Text>
              </View>
            </Card>
          ) : null}

          {error ? (
            <Card>
              <Text style={[styles.detailText, { color: palette.danger }]}>{error}</Text>
            </Card>
          ) : null}

          {currentSession ? (
            <Stack gap="xs">
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Current session</Text>
              <SessionCard session={currentSession} current />
            </Stack>
          ) : null}

          <Stack gap="xs">
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Other active sessions</Text>
            {empty ? (
              <Card>
                <Text style={[styles.deviceTitle, { color: palette.textPrimary }]}>No other active sessions</Text>
                <Text style={[styles.detailText, { color: palette.textSecondary }]}>
                  You’re only signed in on this device.
                </Text>
              </Card>
            ) : (
              <Stack gap="sm">
                {otherSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </Stack>
            )}
          </Stack>

          <Stack gap="xs">
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Security actions</Text>
            <Card>
              <Pressable
                style={({ pressed }) => [
                  styles.logoutOthersBtn,
                  {
                    backgroundColor: palette.dangerSoft,
                    opacity: !hasOtherSessions ? 0.5 : (pressed ? 0.88 : 1),
                  },
                ]}
                onPress={confirmLogoutOthers}
                disabled={loggingOutOthers || !hasOtherSessions}
              >
                <Ionicons name="shield-outline" size={18} color={palette.danger} />
                <Text style={[styles.logoutOthersText, { color: palette.danger }]}>
                  {loggingOutOthers
                    ? "Logging out..."
                    : hasOtherSessions
                      ? "Log out all other devices"
                      : "No other devices to log out"}
                </Text>
              </Pressable>
            </Card>
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  deviceTitle: {
    fontSize: theme.typography.fontSize.sm + 1,
    lineHeight: theme.typography.lineHeight.sm + 2,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  loadingWrap: {
    minHeight: 84,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  currentPill: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  currentPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  logoutOthersBtn: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  logoutOthersText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
