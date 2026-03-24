// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useRouter } from "expo-router";

import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { FormContainer } from "@/components/ui/FormContainer";

export default function LoginScreen() {
  const router = useRouter();
  const { handleLogin, loadingLogin, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    const result = await handleLogin({ email, password });
    if (result.success) {
      router.replace("/home");
    }
  };

  return (
    <FormContainer>
      <Card>
        <AppHeader title="Login" subtitle="Welcome back" />

        <Stack>
          <AppInput
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <AppInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <AppButton title={loadingLogin ? "Logging in..." : "Login"} onPress={onLogin} loading={loadingLogin} />

          <Text style={styles.link} onPress={() => router.push("/register")}>
            Don&apos;t have an account? Register
          </Text>
        </Stack>
      </Card>
    </FormContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    color: theme.colors.danger,
    fontSize: theme.typography.fontSize.sm,
  },
  link: {
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});