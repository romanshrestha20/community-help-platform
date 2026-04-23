import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Row, ScreenView, Stack, theme } from "@/design-system";
import { RequestCardSkeleton } from "@/features/helpRequest/components/RequestCardSkeleton";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { RequestForm } from "@/features/helpRequest/components/RequestForm";
import { useHelpRequest } from "@/features/helpRequest/hooks/helpRequest.hook";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import type { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import {
  formatRequestBudget,
  formatRequestCreatedAt,
  formatRequestLocation,
  getRequestCategoryLabel,
  REQUEST_STATUS_LABELS,
} from "@/features/helpRequest/utils/requestDisplay";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { showSuccessToast } from "@/utils/toast";

type StatusFilter = "ALL" | HelpRequestStatus;

type FilterOption = {
  key: StatusFilter;
  label: string;
  count: number;
};

const FILTER_ORDER: StatusFilter[] = ["ALL", "OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];

const formatBidCount = (count: number) => `${count} bid${count === 1 ? "" : "s"}`;

const sortByNewest = (requests: HelpRequest[]) =>
  [...requests].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const getStatusTone = (status: HelpRequestStatus) => {
  switch (status) {
    case "OPEN":
      return {
        backgroundColor: "#D9F2E2",
        textColor: "#1A6B43",
        icon: "radio-button-on-outline" as const,
      };
    case "ASSIGNED":
      return {
        backgroundColor: "#F4D88B",
        textColor: "#6A4D06",
        icon: "people-outline" as const,
      };
    case "COMPLETED":
      return {
        backgroundColor: "#DBD1FF",
        textColor: "#4E3A8A",
        icon: "checkmark-done-outline" as const,
      };
    case "CANCELLED":
      return {
        backgroundColor: "#F3C1B6",
        textColor: "#72372C",
        icon: "close-circle-outline" as const,
      };
  }
};

const getNextAction = (request: HelpRequest) => {
  switch (request.status) {
    case "OPEN":
      return request.bidCount > 0
        ? "Review incoming bids"
        : "Waiting for helpers";
    case "ASSIGNED":
      return "Track progress";
    case "COMPLETED":
      return "Review closed request";
    case "CANCELLED":
      return "Repost or archive";
  }
};

export const MyRequestsScreen = () => {
  const router = useRouter();
  const { palette } = useThemeContext();
  const { createHelpRequest } = useHelpRequest();
  const { requests, loading, error, refreshing, refreshRequests } = useRequestList({
    scope: "mine",
  });
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>("ALL");

  const sortedRequests = useMemo(() => sortByNewest(requests), [requests]);

  const counts = useMemo(
    () =>
      requests.reduce(
        (summary, request) => {
          summary.ALL += 1;
          summary[request.status] += 1;
          return summary;
        },
        {
          ALL: 0,
          OPEN: 0,
          ASSIGNED: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        } as Record<StatusFilter, number>
      ),
    [requests]
  );

  const filters = useMemo<FilterOption[]>(
    () =>
      FILTER_ORDER.map((key) => ({
        key,
        label: key === "ALL" ? "All" : REQUEST_STATUS_LABELS[key],
        count: counts[key],
      })),
    [counts]
  );

  const visibleRequests = useMemo(
    () =>
      selectedFilter === "ALL"
        ? sortedRequests
        : sortedRequests.filter((request) => request.status === selectedFilter),
    [selectedFilter, sortedRequests]
  );

  const activeCount = counts.OPEN + counts.ASSIGNED;
  const closedCount = counts.COMPLETED + counts.CANCELLED;
  const totalBids = useMemo(
    () => requests.reduce((sum, request) => sum + (request.bidCount ?? 0), 0),
    [requests]
  );
  const latestRequest = sortedRequests[0];
  const latestLabel = latestRequest
    ? formatRequestCreatedAt(latestRequest.createdAt)
    : "No posts yet";

  const handleCreateRequest = async (
    data: Parameters<typeof createHelpRequest>[0]
  ) => {
    const created = await createHelpRequest(data);

    if (created) {
      showSuccessToast("Request created");
      await refreshRequests();
    }

    return created;
  };

  const openRequest = (request: HelpRequest) => {
    router.push(APP_ROUTES.PROFILE_REQUEST_DETAILS(request.id));
  };

  return (
    <ScreenView style={styles.screen}>
      <FlatList
        data={visibleRequests}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={refreshRequests}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <OwnerRequestRow request={item} onPress={() => openRequest(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <AppHeader
              title="My Requests"
              subtitle="Track posts, bids, and next actions."
            />

            <View style={[styles.hero, { backgroundColor: palette.primaryDark }]}>
              <View style={styles.heroGlow} />

              <Row justify="space-between" align="flex-start" gap="md" style={styles.heroTop}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>Owner dashboard</Text>
                  <Text style={styles.heroTitle}>
                    {activeCount > 0
                      ? `${activeCount} active request${activeCount === 1 ? "" : "s"}`
                      : "Ready for your next request"}
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    Review bid activity, update request status, and keep every post moving.
                  </Text>
                </View>

                <RequestForm onSubmit={handleCreateRequest} compactTrigger />
              </Row>

              <View style={styles.heroMetrics}>
                <HeroMetric label="Total" value={String(counts.ALL)} />
                <HeroMetric label="Active" value={String(activeCount)} />
                <HeroMetric label="Bids" value={String(totalBids)} />
              </View>

              <View style={styles.latestStrip}>
                <Ionicons name="time-outline" size={15} color="#B9DDCF" />
                <Text style={styles.latestText}>Latest post: {latestLabel}</Text>
              </View>
            </View>

            {error ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: palette.dangerSoft,
                    borderColor: palette.danger,
                  },
                ]}
              >
                <Ionicons name="warning-outline" size={18} color={palette.danger} />
                <Text style={[styles.errorText, { color: palette.danger }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.filterPanel,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Row justify="space-between" align="center" style={styles.sectionTop}>
                <View style={styles.sectionCopy}>
                  <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                    Request queue
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                    {closedCount} closed · pull down to refresh latest activity
                  </Text>
                </View>
              </Row>

              <View style={styles.filterRow}>
                {filters.map((filter) => {
                  const active = selectedFilter === filter.key;

                  return (
                    <Pressable
                      key={filter.key}
                      onPress={() => setSelectedFilter(filter.key)}
                      style={({ pressed }) => [
                        styles.filterChip,
                        {
                          backgroundColor: active ? palette.primary : palette.surfaceMuted,
                          borderColor: active ? palette.primary : palette.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: active ? palette.textInverse : palette.textPrimary,
                          },
                        ]}
                      >
                        {filter.label}
                      </Text>
                      <Text
                        style={[
                          styles.filterChipCount,
                          {
                            color: active ? palette.textInverse : palette.textSecondary,
                          },
                        ]}
                      >
                        {filter.count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonWrap}>
              {Array.from({ length: 3 }).map((_, index) => (
                <RequestCardSkeleton key={`my-request-skeleton-${index}`} compact />
              ))}
            </View>
          ) : requests.length > 0 ? (
            <View style={styles.filteredEmpty}>
              <RequestEmptyState
                title={`No ${selectedFilter === "ALL" ? "" : REQUEST_STATUS_LABELS[selectedFilter].toLowerCase()} requests`}
                description="Try another status filter to view the rest of your request history."
              />
            </View>
          ) : (
            <RequestEmptyState
              title="No requests yet"
              description="Create your first request and it will appear here with bid and status tracking."
            />
          )
        }
        ListFooterComponent={
          visibleRequests.length > 0 ? (
            <Text style={[styles.caption, { color: palette.textSecondary }]}>
              Pull down to refresh your latest request activity.
            </Text>
          ) : null
        }
      />
    </ScreenView>
  );
};

const HeroMetric = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.heroMetric}>
    <Text style={styles.heroMetricValue}>{value}</Text>
    <Text style={styles.heroMetricLabel}>{label}</Text>
  </View>
);

const OwnerRequestRow = ({
  request,
  onPress,
}: {
  request: HelpRequest;
  onPress: () => void;
}) => {
  const { palette } = useThemeContext();
  const tone = getStatusTone(request.status);
  const location = formatRequestLocation(request);
  const budget = formatRequestBudget(request);
  const category = getRequestCategoryLabel(request);
  const createdAt = formatRequestCreatedAt(request.createdAt);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Manage request: ${request.title}`}
      style={({ pressed }) => [
        styles.requestRow,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View style={[styles.statusRail, { backgroundColor: tone.textColor }]} />

      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <View style={styles.requestTitleWrap}>
            <Text
              numberOfLines={2}
              style={[styles.requestTitle, { color: palette.textPrimary }]}
            >
              {request.title?.trim() || "Untitled request"}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.requestMetaLine, { color: palette.textSecondary }]}
            >
              {category} · {createdAt}
            </Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: tone.backgroundColor }]}>
            <Ionicons name={tone.icon} size={13} color={tone.textColor} />
            <Text style={[styles.statusPillText, { color: tone.textColor }]}>
              {REQUEST_STATUS_LABELS[request.status]}
            </Text>
          </View>
        </Row>

        <Text
          numberOfLines={2}
          style={[styles.description, { color: palette.textSecondary }]}
        >
          {request.description?.trim() || "No description provided."}
        </Text>

        <View style={styles.detailGrid}>
          <DetailPill icon="location-outline" label={location} />
          <DetailPill icon="cash-outline" label={budget} emphasis />
          <DetailPill icon="receipt-outline" label={formatBidCount(request.bidCount ?? 0)} />
        </View>

        <View
          style={[
            styles.nextActionPanel,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.nextActionCopy}>
            <Text style={[styles.nextActionLabel, { color: palette.textSecondary }]}>
              Next action
            </Text>
            <Text style={[styles.nextActionText, { color: palette.textPrimary }]}>
              {getNextAction(request)}
            </Text>
          </View>

          <Row gap="xxs" align="center">
            <Text style={[styles.manageText, { color: palette.primary }]}>Manage</Text>
            <Ionicons name="chevron-forward" size={16} color={palette.primary} />
          </Row>
        </View>
      </Stack>
    </Pressable>
  );
};

const DetailPill = ({
  icon,
  label,
  emphasis = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  emphasis?: boolean;
}) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.detailPill,
        {
          backgroundColor: emphasis
            ? palette.primarySoft ?? palette.surfaceMuted
            : palette.surfaceMuted,
          borderColor: emphasis ? palette.primary : palette.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={emphasis ? palette.primary : palette.textSecondary}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.detailPillText,
          { color: emphasis ? palette.primary : palette.textSecondary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.md,
  },
  headerWrap: {
    marginBottom: theme.spacing.md,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: theme.radius.xl + 6,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  heroGlow: {
    position: "absolute",
    top: -58,
    right: -46,
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: "rgba(223,236,229,0.14)",
  },
  heroTop: {
    zIndex: 1,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    color: "#B9DDCF",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: theme.spacing.xxs,
    color: "#F4F1EA",
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: theme.spacing.xs,
    color: "rgba(242,238,230,0.78)",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
  },
  heroMetrics: {
    zIndex: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  heroMetric: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,253,252,0.14)",
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: "rgba(255,253,252,0.08)",
  },
  heroMetricValue: {
    color: "#F4F1EA",
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "800",
  },
  heroMetricLabel: {
    marginTop: 2,
    color: "rgba(242,238,230,0.68)",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  latestStrip: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: "rgba(255,253,252,0.08)",
    alignSelf: "flex-start",
  },
  latestText: {
    color: "#B9DDCF",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  filterPanel: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  sectionTop: {
    marginBottom: theme.spacing.md,
  },
  sectionCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  sectionSubtitle: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  filterChip: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  filterChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  filterChipCount: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  itemSeparator: {
    height: theme.spacing.sm,
  },
  requestRow: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  statusRail: {
    position: "absolute",
    left: 0,
    top: theme.spacing.md,
    bottom: theme.spacing.md,
    width: 5,
    borderTopRightRadius: theme.radius.fill,
    borderBottomRightRadius: theme.radius.fill,
  },
  requestTitleWrap: {
    flex: 1,
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.xs,
  },
  requestTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  requestMetaLine: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  statusPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "800",
  },
  description: {
    paddingLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
  },
  detailPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  detailPillText: {
    maxWidth: 220,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  nextActionPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  nextActionCopy: {
    flex: 1,
  },
  nextActionLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  nextActionText: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  manageText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  skeletonWrap: {
    gap: theme.spacing.sm,
  },
  filteredEmpty: {
    paddingTop: theme.spacing.md,
  },
  caption: {
    marginTop: theme.spacing.md,
    textAlign: "center",
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
});

export default MyRequestsScreen;
