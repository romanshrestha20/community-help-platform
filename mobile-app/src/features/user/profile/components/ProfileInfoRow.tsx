import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type ProfileInfoRowProps = {
  label: string;
  value?: string | null;
};

export const ProfileInfoRow = ({ label, value }: ProfileInfoRowProps) => {
  const { palette } = useThemeContext();

  return (
    <View style={[styles.container, { borderBottomColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.textPrimary }]}>{label}:</Text>
      <Text style={[styles.value, { color: palette.textSecondary }]}>{value?.trim() ? value : "Not provided"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xxs,
  },
  value: {
    fontSize: theme.typography.fontSize.sm,
  },
});
