// src/app/index.tsx
import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { Card, Screen, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import React from "react";

export default function Home() {
  const router = useRouter();
  const { palette } = useThemeContext();

  return (
    <Screen centered>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Welcome to the Home Page</Text>

        <Stack gap="sm">
          <AppButton title="Go to Login" onPress={() => router.push(APP_ROUTES.AUTH_LOGIN)} />
          <AppButton title="Go to Register" onPress={() => router.push(APP_ROUTES.AUTH_REGISTER)} />
        </Stack>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 560,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
});