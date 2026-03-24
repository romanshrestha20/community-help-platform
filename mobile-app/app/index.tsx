// src/app/index.tsx
import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { Card, Screen, Stack, theme } from "@/design-system";

export default function Home() {
  const router = useRouter();

  return (
    <Screen centered>
      <Card style={styles.card}>
        <Text style={styles.title}>Welcome to the Home Page</Text>

        <Stack gap="sm">
          <AppButton title="Go to Login" onPress={() => router.push("/login")} />
          <AppButton title="Go to Register" onPress={() => router.push("/register")} />
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
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
});