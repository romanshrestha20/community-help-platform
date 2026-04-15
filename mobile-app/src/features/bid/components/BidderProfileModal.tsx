import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { ReviewList, ReviewSummaryCard } from "@/features/reviews/components";
import { formatBidAmount } from "../utils/bidDisplay";
import { Bid } from "../types/bid.types";

type Props = {
  visible: boolean;
  bid: Bid;
  onClose: () => void;
};

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const InfoTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.infoTile,
        {
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={palette.textSecondary} />
      <Text style={[styles.infoTileLabel, { color: palette.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoTileValue, { color: palette.textPrimary }]}>{value}</Text>
    </View>
  );
};

export const BidderProfileModal = ({ visible, bid, onClose }: Props) => {
  const { palette } = useThemeContext();
  const {
    getCachedReviews,
    getCachedSummary,
    getUserReviews,
    loadingByUserId,
  } = useReviews();

  const displayGender = useMemo(() => {
    if (!bid.helperGender) return "Not available";

    return bid.helperGender
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [bid.helperGender]);

  useEffect(() => {
    if (!visible || !bid.helperId) {
      return;
    }

    void getUserReviews(bid.helperId, {
      limit: 3,
      forceRefresh: true,
    });
  }, [bid.helperId, getUserReviews, visible]);

  const summary = getCachedSummary(bid.helperId);
  const reviews = getCachedReviews(bid.helperId);
  const reviewsLoading = Boolean(loadingByUserId[bid.helperId]);
  const locationLabel = bid.helperLocation || "Location not available";

  const quickFacts = [
    displayGender !== "Not available" ? displayGender : null,
    typeof bid.helperAge === "number" ? `${bid.helperAge} yrs` : null,
    bid.helperLocation || null,
  ].filter((value): value is string => Boolean(value));

  const trustSubtitle =
    summary.totalReviews > 0
      ? `${summary.rating.toFixed(1)} average across ${summary.totalReviews} review${summary.totalReviews === 1 ? "" : "s"}`
      : "New to the platform. Reviews will appear here after completed requests.";

  return (
    <AppModal
      visible={visible}
      title="Helper Profile"
      onClose={onClose}
      showCloseButton
      scrollable
      actions={(
        <AppButton
          title="Done"
          variant="ghost"
          fullWidth={false}
          onPress={onClose}
        />
      )}
    >
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.profileAvatarWrap}>
          <ProfileAvatar
            uri={bid.helperAvatarUrl}
            fullName={bid.helperName}
            size={92}
          />
        </View>

        <Text style={[styles.heroName, { color: palette.textPrimary }]}>
          {bid.helperName || "Community helper"}
        </Text>

        <Row gap="xs" align="center" justify="center">
          <Ionicons
            name="star"
            size={15}
            color={palette.warning ?? "#F59E0B"}
          />
          <Text style={[styles.heroRating, { color: palette.textPrimary }]}>
            {summary.rating.toFixed(1)}
          </Text>
          <Text style={[styles.heroRatingMeta, { color: palette.textSecondary }]}>
            · {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
          </Text>
        </Row>

        {/* <Row gap="xs" align="center" justify="center">
          <Ionicons
            name="location-outline"
            size={14}
            color={palette.textSecondary}
          />
          <Text style={[styles.heroLocation, { color: palette.textSecondary }]}>
            {locationLabel}
          </Text>
        </Row> */}

        {quickFacts.length > 0 ? (
          <View style={styles.factsWrap}>
            {quickFacts.map((fact) => (
              <View
                key={fact}
                style={[
                  styles.factChip,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={[styles.factChipText, { color: palette.textPrimary }]}>
                  {fact}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <SectionHeader
        title="About helper"
        subtitle="Quick details to help you decide with confidence."
      />

      <Card style={styles.sectionCard}>
        <View style={styles.quickFactsGrid}>
          <InfoTile
            label="Gender"
            value={displayGender}
            icon="person-outline"
          />
          <InfoTile
            label="Age"
            value={typeof bid.helperAge === "number" ? `${bid.helperAge}` : "Not available"}
            icon="calendar-outline"
          />
        </View>

        {bid.helperEmail ? (
          <View
            style={[
              styles.inlineMetaRow,
              {
                borderTopColor: palette.border,
              },
            ]}
          >
            <Ionicons name="mail-outline" size={14} color={palette.textSecondary} />
            <Text
              numberOfLines={1}
              style={[styles.inlineMetaText, { color: palette.textSecondary }]}
            >
              {bid.helperEmail}
            </Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader
        title="Bid details"
        subtitle="Offer and message for this request."
      />

      <View
        style={[
          styles.featuredAmountCard,
          {
            backgroundColor: palette.primarySoft,
            borderColor: `${palette.primary}33`,
          },
        ]}
      >
        <Row gap="sm" align="center">
          <View style={[styles.amountIconWrap, { backgroundColor: palette.surface }]}>
            <Ionicons name="cash-outline" size={18} color={palette.primary} />
          </View>
          <View style={styles.amountCopy}>
            <Text style={[styles.amountLabel, { color: palette.textSecondary }]}>
              Bid amount
            </Text>
            <Text style={[styles.amountValue, { color: palette.primary }]}>
              {formatBidAmount(bid.amount)}
            </Text>
          </View>
        </Row>
      </View>

      <View
        style={[
          styles.messageCard,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: palette.border,
          },
        ]}
      >
        <Row gap="xs" align="center">
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={15}
            color={palette.textSecondary}
          />
          <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>
            Helper&apos;s message
          </Text>
        </Row>
        <Text style={[styles.profileMessage, { color: palette.textPrimary }]}>
          “{bid.message || "No message provided."}”
        </Text>
      </View>

      <SectionHeader
        title="Trust summary"
        subtitle={trustSubtitle}
      />

      <ReviewSummaryCard summary={summary} title="Ratings & reviews" />

      <SectionHeader
        title="Recent reviews"
        subtitle="Feedback from completed requests."
      />

      <ReviewList
        reviews={reviews}
        loading={reviewsLoading}
        title=""
        emptyMessage="This helper has not received any reviews yet."
        showRequestContext
      />
    </AppModal>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  profileAvatarWrap: {
    alignItems: "center",
  },
  heroName: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: "center",
  },
  heroRating: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  heroRatingMeta: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  heroLocation: {
    fontSize: theme.typography.fontSize.sm,
  },
  factsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxs,
  },
  factChip: {
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  factChipText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionHeader: {
    gap: theme.spacing.xxs,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionCard: {
    borderRadius: theme.radius.xl,
  },
  quickFactsGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  infoTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
  },
  infoTileLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoTileValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  inlineMetaRow: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  inlineMetaText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  featuredAmountCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  amountIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  amountCopy: {
    flex: 1,
  },
  amountLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  amountValue: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  messageCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionEyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  profileMessage: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
});
