import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { Screen, Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { BID_STATUS_LABELS } from "@/features/bid/utils/bidDisplay";
import {
  formatRequestLocation,
  REQUEST_STATUS_LABELS,
} from "@/features/helpRequest/utils/requestDisplay";
import { getRelativePostedTime } from "@/features/helpRequest/utils/requestTime";
import * as reviewService from "@/features/reviews/services/review.service";
import { Review } from "@/features/reviews/types/review.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useProfileActivity } from "@/features/user/hooks/useProfileActivity";
import { useUser } from "@/features/user/hooks/user.hook";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = "requests" | "bids" | "reviews";

type StatusVariant = "success" | "warning" | "danger" | "neutral" | "info";

interface RequestItem {
  id: string;
  title: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  location: string;
  timestamp: string;
}

interface BidItem {
  id: string;
  requestId: string;
  message: string;
  amount: number;
  statusLabel: string;
  statusVariant: StatusVariant;
  requestTitle: string;
  timestamp: string;
}

interface ReviewItem {
  id: string;
  requestId: string;
  title: string;
  rating: number;
  requestTitle: string;
  timestamp: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTimestamp = (value: string): string =>
  getRelativePostedTime(value).replace(/^Posted /, "");

const requestStatusVariant = (
  status: string
): StatusVariant => {
  if (status === "COMPLETED") return "success";
  if (status === "ASSIGNED") return "warning";
  if (status === "CANCELLED") return "danger";
  return "neutral";
};

const bidStatusVariant = (status: string): StatusVariant => {
  if (status === "ACCEPTED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ActivityHistoryScreen() {
  const { user } = useUser();
  const { palette } = useThemeContext();
  const router = useRouter();
  const {
    requests,
    bids,
    loading: activityLoading,
    error: activityError,
    refreshActivity,
  } = useProfileActivity();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("requests");

  const loadReviews = useCallback(async () => {
    if (!user?.id) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const result = await reviewService.getUserReviews(user.id);
      setReviews(result.reviews);
    } catch (err) {
      setReviewsError(
        err instanceof Error ? err.message : "Could not load ratings"
      );
    } finally {
      setReviewsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const requestItems = useMemo<RequestItem[]>(
    () =>
      requests.map((r) => ({
        id: r.id,
        title: r.title,
        statusLabel: REQUEST_STATUS_LABELS[r.status],
        statusVariant: requestStatusVariant(r.status),
        location: formatRequestLocation(r),
        timestamp: formatTimestamp(r.updatedAt ?? r.createdAt),
      })),
    [requests]
  );

  const bidItems = useMemo<BidItem[]>(
    () =>
      bids.map((b) => {
        const requestPreview = (b as {
          helpRequest?: { title?: string | null };
        }).helpRequest;

        return {
          id: b.id,
          requestId: b.helpRequestId,
          message: b.message?.trim() || "Bid submitted",
          amount: b.amount,
          statusLabel: BID_STATUS_LABELS[b.status],
          statusVariant: bidStatusVariant(b.status),
          requestTitle:
            requestPreview?.title?.trim() ||
            `Request ${b.helpRequestId.slice(0, 8)}`,
          timestamp: formatTimestamp(b.updatedAt ?? b.createdAt),
        };
      }),
    [bids]
  );

  const reviewItems = useMemo<ReviewItem[]>(
    () =>
      reviews.map((r) => ({
        id: r.id,
        requestId: r.helpRequest.id,
        title: r.title?.trim() || `${r.rating}/5 rating`,
        rating: r.rating,
        requestTitle: r.helpRequest.title || "Completed request",
        timestamp: formatTimestamp(r.createdAt),
      })),
    [reviews]
  );

  // ── Tab config ──────────────────────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "requests", label: "Requests", count: requestItems.length },
    { key: "bids", label: "Bids", count: bidItems.length },
    { key: "reviews", label: "Reviews", count: reviewItems.length },
  ];

  return (
    <Screen withTabBarSpacing={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <AppHeader
          title="Activity history"
          subtitle="A full record of your requests, bids, and reviews."
          variant="large"
          divider
          showBackButton
          backButtonProps={{ fallback: APP_ROUTES.PROFILE, variant: "secondary" }}
        />

        {/* ── Summary strip ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.summaryStrip,
            { borderColor: palette.border, backgroundColor: palette.surface },
          ]}
        >
          {tabs.map((tab, i) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.summaryCell,
                i < tabs.length - 1 && {
                  borderRightWidth: 0.5,
                  borderRightColor: palette.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryCount,
                  {
                    color:
                      tab.key === "requests"
                        ? palette.primary
                        : tab.key === "bids"
                          ? palette.secondary
                          : palette.info,
                    opacity: activityLoading || reviewsLoading ? 0.35 : 1,
                  },
                ]}
              >
                {tab.key === "reviews"
                  ? reviewsLoading ? "—" : reviewItems.length
                  : activityLoading ? "—" : tab.count}
              </Text>
              <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <View
          style={[
            styles.tabBar,
            { borderColor: palette.border, backgroundColor: palette.surface },
          ]}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const accentColor =
              tab.key === "requests"
                ? palette.primary
                : tab.key === "bids"
                  ? palette.secondary
                  : palette.info;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabItem}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? accentColor : palette.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
                {active && (
                  <View
                    style={[styles.tabUnderline, { backgroundColor: accentColor }]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <View style={styles.tabContent}>
          {activeTab === "requests" && (
            <RequestsTab
              items={requestItems}
              loading={activityLoading}
              error={activityError}
              onRetry={refreshActivity}
              onOpenRequest={(requestId) =>
                router.push(APP_ROUTES.PROFILE_REQUEST_DETAILS(requestId))
              }
            />
          )}
          {activeTab === "bids" && (
            <BidsTab
              items={bidItems}
              loading={activityLoading}
              error={activityError}
              onRetry={refreshActivity}
              onOpenBidRequest={(requestId) =>
                router.push(APP_ROUTES.HOME_REQUEST_DETAILS(requestId))
              }
            />
          )}
          {activeTab === "reviews" && (
            <ReviewsTab
              items={reviewItems}
              loading={reviewsLoading}
              error={reviewsError}
              onRetry={loadReviews}
              onOpenReviewedRequest={(requestId) =>
                router.push(APP_ROUTES.HOME_REQUEST_DETAILS(requestId))
              }
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ─── Tab: Requests ───────────────────────────────────────────────────────────

function RequestsTab({
  items,
  loading,
  error,
  onRetry,
  onOpenRequest,
}: {
  items: RequestItem[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onOpenRequest: (requestId: string) => void;
}) {
  const { palette } = useThemeContext();

  if (loading) return <SkeletonList />;
  if (error)
    return <ErrorState message={error} onRetry={onRetry} />;
  if (items.length === 0)
    return (
      <EmptyState
        message="No request activity yet."
        hint="Posts you create will appear here with their latest status."
      />
    );

  return (
    <Stack>
      <SectionMeta
        title="Requests"
        subtitle="Posts you created and their latest status"
        count={items.length}
        accentColor={palette.primary}
        accentSurface={palette.primaryLight}
        accentText={palette.primaryDark}
      />
      {items.map((item, i) => (
        <RequestRow
          key={item.id}
          item={item}
          isLast={i === items.length - 1}
          onPress={() => onOpenRequest(item.id)}
        />
      ))}
    </Stack>
  );
}

// ─── Tab: Bids ───────────────────────────────────────────────────────────────

function BidsTab({
  items,
  loading,
  error,
  onRetry,
  onOpenBidRequest,
}: {
  items: BidItem[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onOpenBidRequest: (requestId: string) => void;
}) {
  const { palette } = useThemeContext();

  if (loading) return <SkeletonList />;
  if (error)
    return <ErrorState message={error} onRetry={onRetry} />;
  if (items.length === 0)
    return (
      <EmptyState
        message="No bid activity yet."
        hint="Offers you place on community requests will show up here."
      />
    );

  return (
    <Stack>
      <SectionMeta
        title="Bids"
        subtitle="Offers you placed on community requests"
        count={items.length}
        accentColor={palette.secondary}
        accentSurface={palette.secondaryLight}
        accentText="#6B4200"
      />
      {items.map((item, i) => (
        <BidRow
          key={item.id}
          item={item}
          isLast={i === items.length - 1}
          onPress={() => onOpenBidRequest(item.requestId)}
        />
      ))}
    </Stack>
  );
}

// ─── Tab: Reviews ────────────────────────────────────────────────────────────

function ReviewsTab({
  items,
  loading,
  error,
  onRetry,
  onOpenReviewedRequest,
}: {
  items: ReviewItem[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onOpenReviewedRequest: (requestId: string) => void;
}) {
  const { palette } = useThemeContext();

  if (loading) return <SkeletonList />;
  if (error)
    return <ErrorState message={error} onRetry={onRetry} />;
  if (items.length === 0)
    return (
      <EmptyState
        message="No ratings yet."
        hint="Feedback from completed jobs will appear here."
      />
    );

  return (
    <Stack >
      <SectionMeta
        title="Reviews"
        subtitle="Feedback tied to completed work"
        count={items.length}
        accentColor={palette.info}
        accentSurface={palette.infoLight}
        accentText="#2A2870"
      />
      {items.map((item, i) => (
        <ReviewRow
          key={item.id}
          item={item}
          isLast={i === items.length - 1}
          onPress={() => onOpenReviewedRequest(item.requestId)}
        />
      ))}
    </Stack>
  );
}

// ─── Row: Request ─────────────────────────────────────────────────────────────

function RequestRow({
  item,
  isLast,
  onPress,
}: {
  item: RequestItem;
  isLast: boolean;
  onPress?: () => void;
}) {
  const { palette } = useThemeContext();
  const cancelled = item.statusVariant === "danger";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: palette.border },
        cancelled && styles.rowDimmed,
        onPress && { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <StatusIcon variant={item.statusVariant} type="request" />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[
              styles.rowTitle,
              { color: palette.textPrimary },
              cancelled && styles.strikethrough,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.rowTimestamp, { color: palette.textMuted }]}>
            {item.timestamp}
          </Text>
        </View>
        <StatusBadge
          label={item.statusLabel}
          variant={item.statusVariant}
        />
        <View style={styles.rowMeta}>
          <Ionicons name="location-outline" size={12} color={palette.textMuted} />
          <Text
            style={[styles.rowMetaText, { color: palette.textMuted }]}
            numberOfLines={1}
          >
            {item.location}
          </Text>
        </View>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={palette.textMuted} style={styles.rowChevron} />
      ) : null}
    </Pressable>
  );
}

// ─── Row: Bid ─────────────────────────────────────────────────────────────────

function BidRow({
  item,
  isLast,
  onPress,
}: {
  item: BidItem;
  isLast: boolean;
  onPress?: () => void;
}) {
  const { palette } = useThemeContext();
  const rejected = item.statusVariant === "danger";

  const amountColor =
    item.statusVariant === "success"
      ? palette.primary
      : item.statusVariant === "warning"
        ? palette.secondary
        : palette.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: palette.border },
        rejected && styles.rowDimmed,
        onPress && { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <StatusIcon variant={item.statusVariant} type="bid" />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[
              styles.rowTitle,
              { color: palette.textPrimary },
              rejected && styles.strikethrough,
            ]}
            numberOfLines={1}
          >
            {item.message}
          </Text>
          <Text style={[styles.rowTimestamp, { color: palette.textMuted }]}>
            {item.timestamp}
          </Text>
        </View>
        <View style={styles.rowMiddle}>
          <StatusBadge label={item.statusLabel} variant={item.statusVariant} />
          <Text style={[styles.bidAmount, { color: amountColor }]}>
            €{item.amount}
          </Text>
        </View>
        <Text
          style={[styles.rowMetaText, { color: palette.textMuted }]}
          numberOfLines={1}
        >
          {item.requestTitle}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={palette.textMuted} style={styles.rowChevron} />
      ) : null}
    </Pressable>
  );
}

// ─── Row: Review ──────────────────────────────────────────────────────────────

function ReviewRow({
  item,
  isLast,
  onPress,
}: {
  item: ReviewItem;
  isLast: boolean;
  onPress?: () => void;
}) {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: palette.border },
        onPress && { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      {/* Star icon background */}
      <View style={[styles.iconWrap, { backgroundColor: palette.warningSurface }]}>
        <Ionicons name="star" size={16} color={palette.star} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowTitle, { color: palette.textPrimary }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.rowTimestamp, { color: palette.textMuted }]}>
            {item.timestamp}
          </Text>
        </View>
        <StarRow rating={item.rating} />
        <Text
          style={[styles.rowMetaText, { color: palette.textMuted }]}
          numberOfLines={1}
        >
          {item.requestTitle}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={palette.textMuted} style={styles.rowChevron} />
      ) : null}
    </Pressable>
  );
}

// ─── Status icon ─────────────────────────────────────────────────────────────

function StatusIcon({
  variant,
  type,
}: {
  variant: StatusVariant;
  type: "request" | "bid";
}) {
  const { palette } = useThemeContext();

  const config: Record<
    StatusVariant,
    { bg: string; iconColor: string; icon: React.ComponentProps<typeof Ionicons>["name"] }
  > = {
    success: {
      bg: palette.successSurface,
      iconColor: palette.success,
      icon: type === "bid" ? "checkmark-circle" : "checkmark-done",
    },
    warning: {
      bg: palette.warningSurface,
      iconColor: palette.warning,
      icon: type === "bid" ? "time" : "people",
    },
    danger: {
      bg: palette.dangerSurface,
      iconColor: palette.danger,
      icon: "close-circle",
    },
    neutral: {
      bg: palette.surfaceMuted,
      iconColor: palette.textMuted,
      icon: "radio-button-on",
    },
    info: {
      bg: palette.infoSurface,
      iconColor: palette.info,
      icon: "information-circle",
    },
  };

  const { bg, iconColor, icon } = config[variant];

  return (
    <View style={[styles.iconWrap, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={17} color={iconColor} />
    </View>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: StatusVariant;
}) {
  const { palette } = useThemeContext();

  const colors: Record<StatusVariant, { bg: string; text: string }> = {
    success: { bg: palette.successSurface, text: palette.success },
    warning: { bg: palette.warningSurface, text: palette.warning },
    danger: { bg: palette.dangerSurface, text: palette.danger },
    neutral: { bg: palette.surfaceMuted, text: palette.textSecondary },
    info: { bg: palette.infoSurface, text: palette.info },
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[variant].bg }]}>
      <Text style={[styles.badgeText, { color: colors[variant].text }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Star row ─────────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  const { palette } = useThemeContext();
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < rating ? "star" : "star-outline"}
          size={13}
          color={i < rating ? palette.star : palette.border}
        />
      ))}
      <Text style={[styles.ratingText, { color: palette.textMuted }]}>
        {rating}/5
      </Text>
    </View>
  );
}

// ─── Section meta row ─────────────────────────────────────────────────────────

function SectionMeta({
  title,
  subtitle,
  count,
  accentColor,
  accentSurface,
  accentText,
}: {
  title: string;
  subtitle: string;
  count: number;
  accentColor: string;
  accentSurface: string;
  accentText: string;
}) {
  const { palette } = useThemeContext();
  return (
    <View
      style={[
        styles.sectionMeta,
        { borderBottomColor: palette.border },
      ]}
    >
      <View style={styles.sectionMetaLeft}>
        <Text style={[styles.sectionMetaTitle, { color: palette.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.sectionMetaSub, { color: palette.textMuted }]}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.countBadge, { backgroundColor: accentSurface }]}>
        <Text style={[styles.countBadgeText, { color: accentText }]}>
          {count}
        </Text>
      </View>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonList() {
  const { palette } = useThemeContext();
  const rows = [0.55, 0.7, 0.45, 0.6];
  return (
    <View>
      {rows.map((w, i) => (
        <View
          key={i}
          style={[
            styles.row,
            i < rows.length - 1 && {
              borderBottomWidth: 0.5,
              borderBottomColor: palette.border,
            },
          ]}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: palette.surfaceMuted }]}
          />
          <View style={styles.rowBody}>
            <View style={styles.rowTop}>
              <View
                style={[
                  styles.skeletonLine,
                  {
                    width: `${w * 100}%`,
                    backgroundColor: palette.surfaceMuted,
                  },
                ]}
              />
              <View
                style={[
                  styles.skeletonLineXs,
                  { backgroundColor: palette.surfaceMuted },
                ]}
              />
            </View>
            <View
              style={[
                styles.skeletonPill,
                { backgroundColor: palette.surfaceMuted },
              ]}
            />
            <View
              style={[
                styles.skeletonLineSm,
                { backgroundColor: palette.surfaceMuted, marginTop: 4 },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  message,
  hint,
}: {
  message: string;
  hint: string;
}) {
  const { palette } = useThemeContext();
  return (
    <View style={styles.emptyWrap}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: palette.border,
          },
        ]}
      >
        <Ionicons
          name="time-outline"
          size={26}
          color={palette.textMuted}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
        {message}
      </Text>
      <Text style={[styles.emptyHint, { color: palette.textMuted }]}>
        {hint}
      </Text>
    </View>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { palette } = useThemeContext();
  return (
    <View style={styles.errorWrap}>
      <View
        style={[
          styles.errorCard,
          {
            backgroundColor: palette.dangerSurface,
            borderColor: palette.danger + "33",
          },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={18}
          color={palette.danger}
          style={styles.errorIcon}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.errorTitle, { color: palette.danger }]}
          >
            Could not load activity
          </Text>
          <Text
            style={[styles.errorMessage, { color: palette.danger }]}
          >
            {message}
          </Text>
        </View>
      </View>
      {onRetry && (
        <AppButton
          title="Retry"
          variant="primary"
          onPress={onRetry}
          icon={
            <Ionicons
              name="refresh-outline"
              size={16}
              color="#fff"
            />
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.xl,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  summaryCell: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  summaryCount: {
    fontFamily: "Syne_700Bold",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "10%",
    right: "10%",
    height: 2,
    borderRadius: 99,
  },

  // Tab content wrapper
  tabContent: {
    marginTop: theme.spacing.xs,
  },

  // Section meta
  sectionMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 0.5,
  },
  sectionMetaLeft: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  sectionMetaTitle: {
    fontFamily: "Syne_700Bold",
    fontSize: theme.typography.fontSize.md,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionMetaSub: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 16,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  countBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
  },
  rowDimmed: {
    opacity: 0.55,
  },
  rowBody: {
    flex: 1,
    gap: theme.spacing.xxs + 1,
  },
  rowChevron: {
    alignSelf: "center",
    marginTop: 2,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  rowTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 20,
  },
  rowTimestamp: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    flexShrink: 0,
    marginTop: 2,
  },
  rowMiddle: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  rowMetaText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 16,
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },

  // Icon
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },

  // Badge
  badge: {
    alignSelf: "flex-start",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Bid amount
  bidAmount: {
    fontFamily: "Syne_700Bold",
    fontSize: 15,
    fontWeight: "700",
  },

  // Stars
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.xs,
    marginLeft: 4,
  },

  // Skeleton
  skeletonLine: {
    height: 13,
    borderRadius: 4,
  },
  skeletonLineXs: {
    width: "14%",
    height: 11,
    borderRadius: 4,
  },
  skeletonLineSm: {
    width: "38%",
    height: 11,
    borderRadius: 4,
  },
  skeletonPill: {
    width: "26%",
    height: 20,
    borderRadius: 99,
    marginTop: 4,
  },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 240,
  },

  // Error
  errorWrap: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 0.5,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  errorIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 3,
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    opacity: 0.8,
  },
});
