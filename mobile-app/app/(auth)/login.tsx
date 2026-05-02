import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Stack, theme } from "@/design-system";
import {
  AuthActions,
  AuthBanner,
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  AuthHero,
  AuthScreen,
} from "@/features/auth/components";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { validateLoginFormFields } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";
import { useGoogleAuth } from "@/features/auth/google";

const shouldRouteToCompleteProfile = (user: any) => {
  const fullName = user?.fullName || user?.profile?.fullName;
  const hasLocation = Boolean(user?.profile?.address);
  const hasAvatar = Boolean(user?.avatarUrl || user?.profile?.avatarUrl);
  return !fullName || !hasLocation || !hasAvatar;
};

export default function LoginScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const { loadingLogin, loadingGoogleLogin, error, handleLogin, handleGoogleLogin } =
    useAuth();
  const { isGoogleConfigured, isGoogleReady, isSigningIn, signIn } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"email" | "password">();

  const isFormDisabled = loadingLogin || loadingGoogleLogin || isSigningIn;
  const bannerMessage = validationError || error;

  const handleEmailLogin = async () => {
    const validation = validateLoginFormFields({ email, password });

    if (!validation.isValid) {
      setValidationError(validation.formError);
      setFieldErrors(validation.fieldErrors);
      return;
    }

    clearValidationError();
    await handleLogin({ email, password });
  };

  const handleGooglePress = async () => {
    clearValidationError();

    if (!isGoogleConfigured) {
      setValidationError("Google Sign-In is not configured for this app build.");
      return;
    }

    const result = await signIn();

    if (!result.success) {
      if (!result.cancelled) {
        setValidationError(result.message);
      }
      return;
    }

    const authResult = await handleGoogleLogin(result.idToken);
    if (!authResult?.success) {
      return;
    }

    if (shouldRouteToCompleteProfile(authResult.data)) {
      router.replace(APP_ROUTES.AUTH_COMPLETE_PROFILE);
      return;
    }

    router.replace("/(tabs)/home");
  };

  return (
    <AuthScreen>
      <AuthHero
        icon="shield-checkmark-outline"
        eyebrow="Welcome back"
        title="Sign in"
        subtitle="Access requests, messages, and the work you’ve already started."
      />

      <AuthCard>
        <Stack gap="md">
          {bannerMessage ? <AuthBanner tone="error">{bannerMessage}</AuthBanner> : null}

          <AppInput
            label="Email"
            placeholder="name@example.com"
            value={email}
            error={fieldErrors.email ?? null}
            onChangeText={(value) => {
              clearFieldError("email");
              setEmail(value);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isFormDisabled}
          />

          <AppInput
            label="Password"
            placeholder="Enter password"
            value={password}
            error={fieldErrors.password ?? null}
            onChangeText={(value) => {
              clearFieldError("password");
              setPassword(value);
            }}
            secureTextEntry
            editable={!isFormDisabled}
          />

          <Text
            style={[styles.inlineLink, { color: palette.primary }]}
            onPress={() => router.push(APP_ROUTES.AUTH_FORGOT_PASSWORD)}
          >
            Forgot password?
          </Text>

          {!isGoogleConfigured ? (
            <AuthBanner tone="info">
              Google Sign-In is unavailable until the platform client IDs are configured.
            </AuthBanner>
          ) : null}

          <AuthActions>
            <AppButton
              title={loadingLogin ? "Signing in..." : "Sign in"}
              onPress={handleEmailLogin}
              loading={loadingLogin}
              disabled={isFormDisabled}
            />

            <AuthDivider label="or continue with" />

            <AppButton
              title={loadingGoogleLogin || isSigningIn ? "Connecting to Google..." : "Continue with Google"}
              onPress={handleGooglePress}
              disabled={!isGoogleReady || isFormDisabled}
              variant="secondary"
              icon={
                !loadingGoogleLogin ? (
                  <Ionicons
                    name="logo-google"
                    size={16}
                    color={palette.textPrimary}
                  />
                ) : undefined
              }
            />
          </AuthActions>

          <AuthFooterLink
            prefix="Don’t have an account?"
            actionLabel="Create one"
            onPress={() => router.push(APP_ROUTES.AUTH_REGISTER)}
          />
        </Stack>
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  inlineLink: {
    alignSelf: "flex-end",
    marginTop: -theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
