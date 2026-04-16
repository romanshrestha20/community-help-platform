import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function OAuthRedirectScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    WebBrowser.maybeCompleteAuthSession();

    const timeout = window.setTimeout(() => {
      router.replace("/(auth)/login");
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ActivityIndicator color={palette.primary} />
      <Text style={[styles.title, { color: palette.textPrimary }]}>Completing Google sign-in</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        You can close this page if it does not redirect automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    textAlign: "center",
    maxWidth: 360,
  },
});
