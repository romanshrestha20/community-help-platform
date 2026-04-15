import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";

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
  const { loadingLogin, error, handleLogin } = useAuth();

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

  const isFormDisabled = loadingLogin;

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
});