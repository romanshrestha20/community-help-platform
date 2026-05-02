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
import { clearTokens } from "@/utils/token";
import { getMe } from "@/features/auth/api/auth.api";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const params = useLocalSearchParams<{ token?: string | string[]; source?: string | string[] }>();
  const tokenValue = params.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;
  const sourceValue = params.source;
  const source = Array.isArray(sourceValue) ? sourceValue[0] : sourceValue;
  const hasAttemptedVerification = useRef(false);
  const hasAttemptedAutoResend = useRef(false);
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const {
    handleVerifyEmail,
    handleSendEmailVerification,
    loadingVerifyEmail,
    loadingSendEmailVerification,
    error,
  } = useAuth();

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState(
    token
      ? "Verifying your email..."
      : source === "register"
        ? "Account created. We sent a verification email."
        : "We sent a verification email."
  );

  useEffect(() => {
    if (!token || hasAttemptedVerification.current) {
      if (!token) {
        setStatus("idle");
        setMessage("We sent a verification email.");
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

  const handleRefreshVerification = async () => {
    try {
      const me = await getMe();
      if (me.success && me.data) {
        useAuthStore.getState().setUser(me.data);
      }
      if (me.data?.isEmailVerified) {
        setStatus("success");
        setMessage("Email verified successfully.");
        return;
      }
      setStatus("idle");
      setMessage("Email is not verified yet. Please check your inbox and try again.");
    } catch {
      setStatus("error");
      setMessage("Could not refresh verification status. Please try again.");
    }
  };

  const canResendVerification =
    isAuthenticated && currentUser && !currentUser.isEmailVerified;
  const requiresVerification = Boolean(
    isAuthenticated &&
      currentUser &&
      !currentUser.isEmailVerified
  );

  useEffect(() => {
    if (token) return;
    if (!canResendVerification) return;
    if (hasAttemptedAutoResend.current) return;

    hasAttemptedAutoResend.current = true;

    const sendInitialEmail = async () => {
      const result = await handleSendEmailVerification("resend");
      if (result?.success) {
        setStatus("idle");
        setMessage(result.message || "Verification email sent. Please check your inbox.");
        return;
      }

      setStatus("error");
      setMessage(result?.message || "Unable to send verification email.");
    };

    void sendInitialEmail();
  }, [canResendVerification, handleSendEmailVerification, token]);

  return (
    <AuthScreen>
      <AuthHero
        icon="mail-outline"
        eyebrow="Secure your account"
        title={status === "success" ? "Email verified" : "Verify your email"}
        subtitle="Confirm your email address to continue to profile setup."
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
                  router.replace(APP_ROUTES.AUTH_COMPLETE_PROFILE);
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

          {status !== "success" && isAuthenticated ? (
            <AppButton
              title="I have verified"
              onPress={handleRefreshVerification}
              variant="ghost"
            />
          ) : null}

          <AuthFooterLink
            prefix="Need to leave this flow?"
            actionLabel={
              isAuthenticated
                ? requiresVerification
                  ? "Sign out"
                  : "Back to home"
                : "Back to sign in"
            }
            onPress={async () => {
              if (isAuthenticated && requiresVerification) {
                await clearTokens();
                logout();
                router.replace(APP_ROUTES.AUTH_LOGIN);
                return;
              }

              router.replace(isAuthenticated ? "/(tabs)/home" : APP_ROUTES.AUTH_LOGIN);
            }}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}
