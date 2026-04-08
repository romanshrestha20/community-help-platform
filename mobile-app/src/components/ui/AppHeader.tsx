import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Href } from "expo-router";

import { AppBackButton, AppBackButtonProps } from "@/components/ui/AppBackButton";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonProps?: Omit<AppBackButtonProps, "fullWidth">;
};

export const AppHeader = ({
  title,
  subtitle,
  showBackButton = false,
  backButtonProps,
}: Props) => {
  const { palette } = useThemeContext();
  const fallback = (backButtonProps?.fallback as Href | undefined) ?? undefined;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showBackButton ? (
          <AppBackButton
            title=""
            variant="secondary"
            fullWidth={false}
            {...backButtonProps}
            fallback={fallback}
          />
        ) : null}

        <View style={styles.content}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    marginTop: theme.spacing.xxs,
  },
});