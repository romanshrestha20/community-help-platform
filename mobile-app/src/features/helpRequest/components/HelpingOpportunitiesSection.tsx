import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest } from "../types/helpRequest.types";
import { RequestCard } from "./RequestCard";

interface HelpingOpportunitiesSectionProps {
  requests: HelpRequest[];
  onPressBid: (request: HelpRequest) => void;
}

export const AvailableOpportunitiesSection: React.FC<HelpingOpportunitiesSectionProps> = ({
  requests,
  onPressBid,
}) => {
  const { palette } = useThemeContext();
  const hasRequests = requests.length > 0;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          Opportunities
        </Text>

        <View
          style={[
            styles.sectionCountBadge,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.sectionCountText, { color: palette.textSecondary }]}>
            {requests.length}
          </Text>
        </View>
      </View>

      {!hasRequests ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
            No opportunities yet
          </Text>
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
            New nearby requests from other users will appear here when available.
          </Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              primaryActionLabel={request.status === "OPEN" ? "Place Bid" : "Unavailable"}
              primaryActionDisabled={request.status !== "OPEN"}
              onPrimaryAction={() => onPressBid(request)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sectionCountBadge: {
    minWidth: 32,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCountText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  cardsContainer: {
    gap: theme.spacing.md,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});