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

  const isFormDisabled = loadingLogin;

  const handleEmailLogin = async () => {
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
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isFormDisabled}
          />

          <AppInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isFormDisabled}
          />

          {error ? (
            <Text style={[styles.error, { color: palette.danger }]}>
              {error}
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