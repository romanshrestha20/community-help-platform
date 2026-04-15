import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import type { ReviewSummary } from "../types/review.types";

type Props = {
  summary: ReviewSummary;
  title?: string;
};

export const ReviewSummaryCard = ({
  summary,
  title = "Ratings & Reviews",
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <Card style={styles.card}>
      <Stack gap="sm">
        <View>
          <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Ratings from completed request feedback.
          </Text>
        </View>

        <Row gap="sm">
          <View
            style={[
              styles.primaryStat,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Row gap="xs" align="center">
              <Ionicons
                name="star"
                size={20}
                color={palette.warning ?? "#F59E0B"}
              />
              <Text style={[styles.primaryValue, { color: palette.textPrimary }]}>
                {summary.rating.toFixed(1)}
              </Text>
            </Row>
            <Row gap="xxs" align="center">
              {Array.from({ length: 5 }, (_, index) => (
                <Ionicons
                  key={index}
                  name={index < Math.round(summary.rating) ? "star" : "star-outline"}
                  size={12}
                  color={palette.warning ?? "#F59E0B"}
                />
              ))}
            </Row>
            <Text style={[styles.primaryLabel, { color: palette.textSecondary }]}>
              Average rating
            </Text>
          </View>

          <View style={styles.secondaryStats}>
            <StatPill
              label="Reviews"
              value={String(summary.totalReviews)}
            />
            <StatPill
              label="Completed requests"
              value={String(summary.completedHelps)}
            />
          </View>
        </Row>
      </Stack>
    </Card>
  );
};

const StatPill = ({ label, value }: { label: string; value: string }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.statValue, { color: palette.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
  },
  primaryStat: {
    flex: 1.2,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  primaryValue: {
    fontSize: theme.typography.fontSize.xl + 2,
    fontWeight: theme.typography.fontWeight.bold,
  },
  primaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  secondaryStats: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  statPill: {
    flex: 1,
    minHeight: 74,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: "center",
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statLabel: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
  },
});
