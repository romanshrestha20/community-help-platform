import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  rating?: number;
  helpCount?: number;
};

export const ProfileStatsRow = ({ rating = 0, helpCount = 0 }: Props) => {
  return (
    <View style={styles.row}>
      <StatCard label="Rating" value={rating.toFixed(1)} />
      <StatCard label="Helps" value={String(helpCount)} />
    </View>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.value, { color: palette.primary }]}>{value}</Text>
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs + 2,
    borderWidth: 1,
  },
  value: {
    fontSize: typography.fontSize.lg + 2,
    fontWeight: typography.fontWeight.bold,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});