import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import type { Review } from "../types/review.types";
import { ReviewCard } from "./ReviewCard";

type Props = {
  reviews: Review[];
  loading?: boolean;
  title?: string;
  emptyMessage?: string;
  showRequestContext?: boolean;
};

export const ReviewList = ({
  reviews,
  loading = false,
  title = "Recent reviews",
  emptyMessage = "This helper has not received any reviews yet.",
  showRequestContext = true,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <Stack gap="md">
      {title ? (
        <View>
          <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Feedback from completed requests.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={palette.primary} />
        </View>
      ) : null}

      {!loading && reviews.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
            {emptyMessage}
          </Text>
          <Text style={[styles.emptySubtext, { color: palette.textMuted }]}>
            Reviews will appear here after completed requests.
          </Text>
        </View>
      ) : null}

      {!loading ? (
        <Stack gap="sm">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showRequestContext={showRequestContext}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
  },
  loadingWrap: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptySubtext: {
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: theme.typography.fontSize.xs,
  },
});
