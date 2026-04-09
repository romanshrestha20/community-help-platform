import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { FormContainer } from "@/components/ui/FormContainer";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { validateLoginForm } from "@/features/auth/utils/authValidation";
import { useFormValidation } from "@/utils/validation/useFormValidation";

export default function LoginScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();

  const {
    loadingLogin,
    error,
    handleLogin,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { validationError, setValidationError, clearValidationError } = useFormValidation();

  const isFormDisabled = loadingLogin;

  const handleEmailLogin = async () => {
    const validation = validateLoginForm({ email, password });
    if (validation) {
      setValidationError(validation);
      return;
    }

    clearValidationError();
    await handleLogin({ email, password });
  };

  return (
    <FormContainer>
      <Card>
        <AppHeader title="Sign In" subtitle="Sign in to continue helping your community" />

        <Stack>
          <AppInput
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={(value) => {
              clearValidationError();
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
            onChangeText={(value) => {
              clearValidationError();
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
            title={loadingLogin ? "Logging in..." : "Login"}
            onPress={handleEmailLogin}
            loading={loadingLogin}
            disabled={isFormDisabled}
          />

          <Text
            style={[styles.link, { color: palette.primary }]}
            onPress={() => router.push(APP_ROUTES.AUTH_REGISTER)}
          >
            Don&apos;t have an account? Register
          </Text>
        </Stack>
      </Card>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: theme.typography.fontSize.sm,
  },
  link: {
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
