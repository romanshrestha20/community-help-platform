import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as GoogleAuth from "expo-auth-session/providers/google";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { validateLoginFormFields } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function LoginScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const { loadingLogin, loadingGoogleLogin, error, handleLogin, handleGoogleLogin } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const consumedGoogleTokenRef = useRef<string | null>(null);

  const {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearValidationError,
  } = useFormValidation<"email" | "password">();

  const webOrigin =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI || "http://localhost:8081";
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  const redirectUri =
    Platform.OS === "web"
      ? `${webOrigin}/oauthredirect`.replace(/\/+oauthredirect$/, "/oauthredirect")
      : AuthSession.makeRedirectUri({
        scheme: "mobileapp",
        path: "oauthredirect",
      });

  const [request, response, promptAsync] = GoogleAuth.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
      profileImageSize: 120,
    });
  }, []);

  useEffect(() => {
    if (response?.type !== "success") {
      return;
    }

    const idToken =
      response.authentication?.idToken ||
      (typeof response.params?.id_token === "string" ? response.params.id_token : null);

    if (idToken && consumedGoogleTokenRef.current !== idToken) {
      consumedGoogleTokenRef.current = idToken;
      void handleGoogleLogin(idToken);
    }
  }, [handleGoogleLogin, response]);

  const isFormDisabled = loadingLogin || loadingGoogleLogin;

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
    consumedGoogleTokenRef.current = null;

    if (Platform.OS === "web") {
      await promptAsync();
      return;
    }

    if (isExpoGo) {
      return;
    }

    try {
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      const result = await GoogleSignin.signIn();

      if (result.type !== "success") {
        return;
      }

      const idToken = result.data.idToken;

      if (!idToken) {
        throw new Error("Google sign-in did not return an ID token.");
      }

      await handleGoogleLogin(idToken);
    } catch (authError) {
      console.error("Native Google sign-in error:", authError);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.authBlock}>
          <AppHeader
            title="Sign In"
            subtitle="Sign in to continue helping your community"
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

              <Pressable
                onPress={() => router.push(APP_ROUTES.AUTH_FORGOT_PASSWORD)}
                disabled={isFormDisabled}
              >
                <Text
                  style={[
                    styles.secondaryLinkText,
                    { color: palette.primary },
                  ]}
                >
                  Forgot password?
                </Text>
              </Pressable>

              {validationError || error ? (
                <Text style={[styles.error, { color: palette.danger }]}>
                  {validationError || error}
                </Text>
              ) : null}

              <AppButton
                title={loadingLogin ? "Signing in..." : "Sign In"}
                onPress={handleEmailLogin}
                loading={loadingLogin}
                disabled={isFormDisabled}
              />

              <AppButton
                title={loadingGoogleLogin ? "Connecting to Google..." : "Continue with Google"}
                onPress={handleGooglePress}
                disabled={(Platform.OS === "web" && !request) || isFormDisabled || isExpoGo}
              />

              {Platform.OS !== "web" && isExpoGo ? (
                <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                  Google Sign-In requires an iOS or Android development build, not Expo Go.
                </Text>
              ) : null}

              <Pressable onPress={() => router.push(APP_ROUTES.AUTH_REGISTER)}>
                <Text style={styles.linkText}>
                  <Text style={{ color: palette.textSecondary }}>
                    Don&apos;t have an account?{" "}
                  </Text>
                  <Text style={{ color: palette.primary }}>Register</Text>
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
  error: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  linkText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  secondaryLinkText: {
    textAlign: "right",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  helperText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
