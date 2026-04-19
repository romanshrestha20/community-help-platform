import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export default function RequestMapScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();

  return (
    <ScreenView style={styles.screen}>
      <AppHeader
        title="Request map"
        subtitle="Explore nearby requests geographically."
        showBackButton
        backButtonProps={{
          fallback: APP_ROUTES.HOME_REQUESTS,
          variant: "secondary",
        }}
        rightAction={{
          icon: "list-outline",
          onPress: () => router.replace(APP_ROUTES.HOME_REQUESTS),
          accessibilityLabel: "Switch to list view",
          color: palette.textPrimary,
        }}
      />

      <View
        style={[
          styles.stateCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
          Map preview is native-only
        </Text>
        <Text style={[styles.stateBody, { color: palette.textSecondary }]}>
          Open a native development build to test markers, current location, and search
          this area behavior.
        </Text>
        <View style={styles.actionWrap}>
          <AppButton
            title="Back to list"
            variant="secondary"
            onPress={() => router.replace(APP_ROUTES.HOME_REQUESTS)}
          />
        </View>
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  stateCard: {
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  stateBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  actionWrap: {
    marginTop: theme.spacing.xs,
    alignSelf: "flex-start",
  },
});
