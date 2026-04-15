import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import type { Review } from "../types/review.types";

type Props = {
  review: Review;
  showRequestContext?: boolean;
};

const formatReviewDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const ReviewCard = ({
  review,
  showRequestContext = true,
}: Props) => {
  const { palette } = useThemeContext();
  const displayName = review.reviewer.fullName || "Community member";
  const formattedDate = useMemo(
    () => formatReviewDate(review.createdAt),
    [review.createdAt]
  );

  return (
    <Card style={styles.card}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <View style={styles.identityWrap}>
            <Text style={[styles.name, { color: palette.textPrimary }]}>
              {displayName}
            </Text>
            {formattedDate ? (
              <Text style={[styles.meta, { color: palette.textSecondary }]}>
                {formattedDate}
              </Text>
            ) : null}
          </View>

          <Row gap="xxs" align="center">
            {Array.from({ length: 5 }, (_, index) => (
              <Ionicons
                key={index}
                name={index < Math.round(review.rating) ? "star" : "star-outline"}
                size={12}
                color={palette.warning ?? "#F59E0B"}
              />
            ))}
            <Text style={[styles.ratingText, { color: palette.textPrimary }]}>
              {review.rating.toFixed(1)}
            </Text>
          </Row>
        </Row>

        {review.title ? (
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {review.title}
          </Text>
        ) : null}

        <Text style={[styles.comment, { color: palette.textPrimary }]}>
          {review.comment}
        </Text>

        {showRequestContext ? (
          <View
            style={[
              styles.requestBox,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Row gap="xs" align="center">
              <Ionicons
                name="briefcase-outline"
                size={13}
                color={palette.textSecondary}
              />
              <Text style={[styles.requestLabel, { color: palette.textSecondary }]}>
                Request
              </Text>
            </Row>
            <Text
              numberOfLines={1}
              style={[styles.requestTitle, { color: palette.textPrimary }]}
            >
              {review.helpRequest.title}
            </Text>
          </View>
        ) : null}
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
  },
  identityWrap: {
    flex: 1,
  },
  name: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  meta: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  comment: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  requestBox: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  requestLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
  },
  requestTitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
