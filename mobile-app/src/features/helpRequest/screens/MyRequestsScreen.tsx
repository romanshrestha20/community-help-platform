import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Row, ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { RequestCardSkeleton } from "@/features/helpRequest/components/RequestCardSkeleton";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { RequestForm } from "@/features/helpRequest/components/RequestForm";
import { useHelpRequest } from "@/features/helpRequest/hooks/helpRequest.hook";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import type { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import {
  formatRequestBudget,
  formatRequestCreatedAt,
  formatRequestLocation,
  getRequestCategoryLabel,
  REQUEST_STATUS_LABELS,
} from "@/features/helpRequest/utils/requestDisplay";
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

const getStatusTone = (palette: ReturnType<typeof useThemeContext>["palette"], status: HelpRequestStatus) => {
  switch (status) {
    case "OPEN":
      return {
        surface: palette.successSoft ?? "#D9F2E2",
        text: palette.success ?? "#1A6B43",
        icon: "radio-button-on-outline" as const,
      };
    case "ASSIGNED":
      return {
        surface: palette.warningSoft ?? "#F4D88B",
        text: palette.warning ?? "#6A4D06",
        icon: "people-outline" as const,
      };
    case "COMPLETED":
      return {
        surface: palette.infoSoft ?? "#DBD1FF",
        text: palette.info ?? "#4E3A8A",
        icon: "checkmark-done-outline" as const,
      };
    case "CANCELLED":
      return {
        surface: palette.dangerSoft ?? "#F3C1B6",
        text: palette.danger ?? "#72372C",
        icon: "close-circle-outline" as const,
      };
  }
};

const getNextAction = (request: HelpRequest) => {
  switch (request.status) {
    case "OPEN":
      return request.bidCount > 0 ? "Review incoming bids" : "Waiting for helpers";
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
              subtitle="Track live posts, bids, and request progress."
            />

            <View
              style={[
                styles.summaryPanel,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Row justify="space-between" align="center" gap="md" style={styles.summaryTop}>
                <View style={styles.summaryCopy}>
                  <Text style={[styles.summaryEyebrow, { color: palette.textSecondary }]}>
                    Request workspace
                  </Text>
                  <Text style={[styles.summaryTitle, { color: palette.textPrimary }]}>
                    {activeCount > 0
                      ? `${activeCount} active request${activeCount === 1 ? "" : "s"}`
                      : "Start your first request"}
                  </Text>
                  <Text style={[styles.summarySubtitle, { color: palette.textSecondary }]}>
                    Manage responses, update statuses, and keep your request history organized.
                  </Text>
                </View>

                <RequestForm onSubmit={handleCreateRequest} compactTrigger />
              </Row>

              <View style={styles.metricRow}>
                <MetricChip
                  label="Total"
                  value={String(counts.ALL)}
                  tint={palette.primary}
                  fill={palette.primarySoft ?? palette.surfaceMuted}
                />
                <MetricChip
                  label="Active"
                  value={String(activeCount)}
                  tint={palette.secondary}
                  fill={palette.secondarySoft ?? palette.surfaceMuted}
                />
                <MetricChip
                  label="Bids"
                  value={String(totalBids)}
                  tint={palette.info}
                  fill={palette.infoSoft ?? palette.surfaceMuted}
                />
              </View>

              <View
                style={[
                  styles.latestRow,
                  {
                    borderTopColor: palette.border,
                  },
                ]}
              >
                <Row align="center" gap="xs">
                  <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                  <Text style={[styles.latestLabel, { color: palette.textSecondary }]}>
                    Latest post
                  </Text>
                </Row>
                <Text style={[styles.latestValue, { color: palette.textPrimary }]}>
                  {latestLabel}
                </Text>
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
                styles.sectionBlock,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.sectionTop}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Request queue
                </Text>
                <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                  {closedCount} closed requests
                </Text>
              </View>

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
                          backgroundColor: active ? palette.textPrimary : palette.surfaceMuted,
                          borderColor: active ? palette.textPrimary : palette.border,
                          opacity: pressed ? 0.84 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: active ? palette.surface : palette.textPrimary,
                          },
                        ]}
                      >
                        {filter.label}
                      </Text>
                      <Text
                        style={[
                          styles.filterChipCount,
                          {
                            color: active ? palette.surface : palette.textSecondary,
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
                description="Try another filter to view the rest of your request history."
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

const MetricChip = ({
  label,
  value,
  tint,
  fill,
}: {
  label: string;
  value: string;
  tint: string;
  fill: string;
}) => (
  <View style={[styles.metricChip, { backgroundColor: fill }]}>
    <Text style={[styles.metricValue, { color: tint }]}>{value}</Text>
    <Text style={[styles.metricLabel, { color: tint }]}>{label}</Text>
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
  const tone = getStatusTone(palette, request.status);
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
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Row justify="space-between" align="flex-start" gap="sm">
        <View style={styles.requestCopy}>
          <Row align="center" gap="xs" style={styles.requestTopline}>
            <View style={[styles.categoryDot, { backgroundColor: palette.primary }]} />
            <Text style={[styles.requestMetaLine, { color: palette.textSecondary }]}>
              {category}
            </Text>
            <Text style={[styles.requestMetaBullet, { color: palette.textMuted }]}>•</Text>
            <Text style={[styles.requestMetaLine, { color: palette.textSecondary }]}>
              {createdAt}
            </Text>
          </Row>

          <Text
            numberOfLines={2}
            style={[styles.requestTitle, { color: palette.textPrimary }]}
          >
            {request.title?.trim() || "Untitled request"}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: tone.surface }]}>
          <Ionicons name={tone.icon} size={13} color={tone.text} />
          <Text style={[styles.statusPillText, { color: tone.text }]}>
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

      <View style={styles.detailRow}>
        <DetailChip icon="location-outline" label={location} />
        <DetailChip icon="cash-outline" label={budget} emphasis />
        <DetailChip icon="receipt-outline" label={formatBidCount(request.bidCount ?? 0)} />
      </View>

      <View
        style={[
          styles.footerRow,
          {
            borderTopColor: palette.border,
          },
        ]}
      >
        <View style={styles.nextActionCopy}>
          <Text style={[styles.nextActionLabel, { color: palette.textSecondary }]}>
            Next
          </Text>
          <Text style={[styles.nextActionText, { color: palette.textPrimary }]}>
            {getNextAction(request)}
          </Text>
        </View>

        <Row gap="xxs" align="center">
          <Text style={[styles.manageText, { color: palette.primary }]}>Open</Text>
          <Ionicons name="chevron-forward" size={15} color={palette.primary} />
        </Row>
      </View>
    </Pressable>
  );
};

const DetailChip = ({
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
        styles.detailChip,
        {
          backgroundColor: emphasis
            ? palette.primarySoft ?? palette.surfaceMuted
            : palette.surfaceMuted,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={13}
        color={emphasis ? palette.primary : palette.textSecondary}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.detailChipText,
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
    paddingBottom: theme.spacing.lg,
  },
  headerWrap: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  summaryPanel: {
    borderWidth: 1,
    borderRadius: 28,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  summaryTop: {
    alignItems: "flex-start",
  },
  summaryCopy: {
    flex: 1,
  },
  summaryEyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryTitle: {
    marginTop: 4,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  summarySubtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  metricChip: {
    flex: 1,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 24,
    fontWeight: "800",
  },
  metricLabel: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  latestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: theme.spacing.sm,
  },
  latestLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  latestValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionBlock: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  sectionTop: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  sectionSubtitle: {
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
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  requestCopy: {
    flex: 1,
  },
  requestTopline: {
    marginBottom: 8,
    flexWrap: "wrap",
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  requestMetaLine: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  requestMetaBullet: {
    fontSize: 12,
    lineHeight: 12,
  },
  requestTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
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
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  detailChip: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  detailChipText: {
    maxWidth: 220,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    paddingTop: theme.spacing.sm,
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
