import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const tokenValue = params.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;
  const hasAttemptedVerification = useRef(false);
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    handleVerifyEmail,
    handleSendEmailVerification,
    loadingVerifyEmail,
    loadingSendEmailVerification,
    error,
  } = useAuth();

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token || hasAttemptedVerification.current) {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing. Request a new verification email.");
      }
      return;
    }

    hasAttemptedVerification.current = true;

    const runVerification = async () => {
      const result = await handleVerifyEmail(token);

      if (result?.success) {
        setStatus("success");
        setMessage(result.message || "Email verified successfully.");
        return;
      }

      setStatus("error");
      setMessage(result?.message || "Email verification failed.");
    };

    void runVerification();
  }, [handleVerifyEmail, token]);

  const handleResend = async () => {
    const result = await handleSendEmailVerification("resend");

    if (result?.success) {
      setStatus("idle");
      setMessage(result.message);
      return;
    }

    setStatus("error");
    setMessage(result?.message || "Unable to send verification email.");
  };

  const canResendVerification =
    isAuthenticated && currentUser && !currentUser.isEmailVerified;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.authBlock}>
          <AppHeader
            title="Verify Email"
            subtitle="Confirm your email address to finish setting up your account."
            align="center"
            variant="large"
          />

          <Card
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Stack gap="md">
              {loadingVerifyEmail ? (
                <View style={styles.loader}>
                  <ActivityIndicator color={palette.primary} />
                </View>
              ) : null}

              <Text
                style={[
                  styles.message,
                  {
                    color:
                      status === "success"
                        ? palette.success
                        : status === "error"
                          ? palette.danger
                          : palette.textPrimary,
                  },
                ]}
              >
                {error || message}
              </Text>

              {status === "success" ? (
                <AppButton
                  title="Continue"
                  onPress={() => {
                    if (isAuthenticated) {
                      router.replace("/(tabs)/home");
                      return;
                    }

                    router.replace(APP_ROUTES.AUTH_LOGIN);
                  }}
                />
              ) : null}

              {status !== "success" && canResendVerification ? (
                <AppButton
                  title={
                    loadingSendEmailVerification
                      ? "Sending email..."
                      : "Resend verification email"
                  }
                  onPress={handleResend}
                  loading={loadingSendEmailVerification}
                  disabled={loadingSendEmailVerification}
                />
              ) : null}

              <Pressable onPress={() => router.replace(APP_ROUTES.AUTH_LOGIN)}>
                <Text style={styles.linkText}>
                  <Text style={{ color: palette.textSecondary }}>Back to </Text>
                  <Text style={{ color: palette.primary }}>Sign in</Text>
                </Text>
              </Pressable>
            </Stack>
          </Card>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    justifyContent: "center",
  },
  authBlock: {
    width: "100%",
    gap: theme.spacing.lg,
  },
  card: {
    width: "100%",
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
  },
  loader: {
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: "center",
  },
  linkText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
});
