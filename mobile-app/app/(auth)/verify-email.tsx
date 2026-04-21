import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { Stack } from "@/design-system";
import {
  AuthBanner,
  AuthCard,
  AuthFooterLink,
  AuthHero,
  AuthScreen,
} from "@/features/auth/components";
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
    <AuthScreen>
      <AuthHero
        icon="mail-outline"
        eyebrow="Secure your account"
        title={status === "success" ? "Email verified" : "Verify your email"}
        subtitle="Confirm your email address to finish setting up your account and unlock the rest of the flow."
      />

      <AuthCard>
        <Stack gap="md">
          {loadingVerifyEmail ? (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : null}

          <AuthBanner tone={status === "success" ? "success" : status === "error" ? "error" : "info"}>
            {error || message}
          </AuthBanner>

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
              variant="secondary"
            />
          ) : null}

          <AuthFooterLink
            prefix="Need to leave this flow?"
            actionLabel="Back to sign in"
            onPress={() => router.replace(APP_ROUTES.AUTH_LOGIN)}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}
