import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  title: string;
  subtitle?: string;
};

export const AppHeader = ({ title, subtitle }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
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