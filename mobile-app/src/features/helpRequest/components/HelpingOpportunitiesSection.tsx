import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { Bid } from "@/features/bid/types/bid.types";
import { canMutateBid } from "@/features/bid/utils/bidValidation";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest } from "../types/helpRequest.types";
import { RequestCard } from "./RequestCard";
import { AppLocation } from "@/features/location/types/location.types";

interface HelpingOpportunitiesSectionProps {
  requests: HelpRequest[];
  myBids?: Bid[];
  onPressBid: (request: HelpRequest) => void;
  onRemoveBid?: (request: HelpRequest, bid: Bid) => void;
 userLocation?: AppLocation | null;
}

export const AvailableOpportunitiesSection: React.FC<HelpingOpportunitiesSectionProps> = ({
  requests,
  myBids = [],
  onPressBid,
  onRemoveBid,
  userLocation,
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
            (() => {
              const existingBid = myBids.find((bid) => bid.helpRequestId === request.id) ?? null;
              const canRemoveBid = Boolean(existingBid && canMutateBid(existingBid.status));
              const isAlreadyBid = Boolean(existingBid);

              return (
                <RequestCard
                  key={request.id}
                  request={request}
                                    userLocation={userLocation}
                  primaryActionLabel={
                    canRemoveBid
                      ? "Remove Bid"
                      : isAlreadyBid
                        ? "Bid Sent"
                        : request.status === "OPEN"
                          ? "Place Bid"
                          : "Unavailable"
                  }
                  primaryActionDisabled={canRemoveBid ? false : isAlreadyBid || request.status !== "OPEN"}
                  onPrimaryAction={() => {
                    if (canRemoveBid && existingBid && onRemoveBid) {
                      onRemoveBid(request, existingBid);
                      return;
                    }

                    if (isAlreadyBid) {
                      return;
                    }

                    onPressBid(request);
                  }}
                />
              );
            })()
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
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});