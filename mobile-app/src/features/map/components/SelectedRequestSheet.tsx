import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { MapRequestItem } from "@/features/map/types/map.types";
import {
  formatRequestBudget,
  formatRequestLocation,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import { getRelativePostedTime } from "@/features/helpRequest/utils/requestTime";
import { isRequestOpenForBidding } from "@/features/helpRequest/utils/requestValidation";
import {
  getUrgentTimeRemainingLabel,
  isUrgentRequestActive,
} from "@/features/helpRequest/utils/urgent";
import { formatDistance } from "@/utils/distance";

type Props = {
  request: MapRequestItem;
  onViewDetails: () => void;
  onBidRequest?: () => void;
};

export const SelectedRequestSheet = ({ request, onViewDetails, onBidRequest }: Props) => {
  const { palette } = useThemeContext();
  const canBid = Boolean(onBidRequest && isRequestOpenForBidding(request.status));
  const isUrgentActive = request.status === "OPEN" && isUrgentRequestActive(request);

  return (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>{request.title}</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {getRequestCategoryLabel(request)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={palette.textSecondary} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.pillGroup}>
          <View style={[styles.pill, { backgroundColor: palette.surfaceSecondary }]}>
            <Text style={[styles.pillText, { color: palette.textPrimary }]}>{request.status}</Text>
          </View>

          {isUrgentActive ? (
            <View style={[styles.pill, { backgroundColor: palette.dangerSoftFill }]}>
              <Text style={[styles.pillText, { color: palette.danger }]}>
                Urgent · {getUrgentTimeRemainingLabel(request.urgentExpiresAt)}
              </Text>
            </View>
          ) : null}

          {typeof request.distanceKm === "number" ? (
            <View style={[styles.pill, { backgroundColor: palette.primarySoft }]}>
              <Text style={[styles.pillText, { color: palette.primary }]}>
                {formatDistance(request.distanceKm)} away
              </Text>
            </View>
          ) : null}

          <View style={[styles.pill, { backgroundColor: palette.surfaceSecondary }]}>
            <Text style={[styles.pillText, { color: palette.textSecondary }]}>
              {getRelativePostedTime(request.createdAt)}
            </Text>
          </View>

          <View style={[styles.pill, { backgroundColor: palette.surfaceSecondary }]}>
            <Text style={[styles.pillText, { color: palette.textSecondary }]}>
              {request.bidCount} bid{request.bidCount === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        <View style={styles.budgetWrap}>
          <Text style={[styles.budget, { color: palette.primary }]}>{formatRequestBudget(request)}</Text>
        </View>
      </View>

      <Text numberOfLines={1} style={[styles.location, { color: palette.textSecondary }]}>
        {formatRequestLocation(request)}
      </Text>

      <Text numberOfLines={1} style={[styles.requester, { color: palette.textSecondary }]}>
        {request.requesterName
          ? `Requester: ${request.requesterName}`
          : "Requester: Community member"}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onViewDetails}
          style={({ pressed }) => [
            styles.ghostAction,
            {
              borderColor: palette.borderStrong,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.ghostActionText, { color: palette.textPrimary }]}>
            {canBid ? "Details" : "View details"}
          </Text>
        </Pressable>

        {canBid ? (
          <Pressable
            onPress={() => onBidRequest?.()}
            style={({ pressed }) => [
              styles.primaryAction,
              {
                backgroundColor: palette.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryActionText, { color: palette.textInverse }]}>Submit offer</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 10,
    marginBottom: 6,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
    marginTop: 2,
  },
  pillGroup: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  budgetWrap: {
    minWidth: 84,
    alignItems: "flex-end",
  },
  budget: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.2,
  },
  location: {
    marginTop: 12,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  requester: {
    marginTop: 6,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.sm,
  },
  actionsRow: {
    flexDirection: "row",
    columnGap: 10,
    marginTop: 16,
  },
  ghostAction: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostActionText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.1,
  },
  primaryAction: {
    flex: 2,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.1,
  },
});
