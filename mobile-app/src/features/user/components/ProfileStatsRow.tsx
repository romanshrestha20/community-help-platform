import React from "react";
import { StyleSheet, Text } from "react-native";

import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  rating?: number;
  helpCount?: number;
};

export const ProfileStatsRow = ({ rating = 0, helpCount = 0 }: Props) => {
  return (
    <Row gap="sm">
      <StatCard label="Rating" value={rating.toFixed(1)} />
      <StatCard label="Helps" value={String(helpCount)} />
    </Row>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => {
  const { palette } = useThemeContext();

  return (
    <Card style={styles.card}>
      <Stack gap="xs" style={styles.center}>
        <Text style={[styles.value, { color: palette.primary }]}>{value}</Text>
        <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  center: {
    alignItems: "center",
  },
  value: {
    fontSize: theme.typography.fontSize.lg + 2,
    fontWeight: theme.typography.fontWeight.bold,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});