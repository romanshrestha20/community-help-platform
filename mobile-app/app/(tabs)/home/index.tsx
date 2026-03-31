import React, { useEffect, useMemo, useState } from "react";
import { Text, StyleSheet, View } from "react-native";
import { Screen, Card, theme } from "@/design-system";
import { RequestCard, RequestFilters, RequestForm, useHomeData } from "@/features/helpRequest/components";
import { BidList } from "@/features/bid/components";
import { GreetingOverview } from "@/features/home/components";
import { useGlobalFilters } from "@/features/helpRequest/hooks/useGlobalFilters";
import { CreateHelpRequestData } from "@/features/helpRequest/types/helpRequest.types";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const { filters, updateFilter, resetFilters } = useGlobalFilters();
  const { requests, recentBids, myBids, loadHomeData, addNewRequest } = useHomeData();
  const [formLoading, setFormLoading] = useState(false);

  // Filtered requests according to global filters
  const filteredRequests = useMemo(() => {
    let next = [...requests];

    if (filters.status !== "ALL") next = next.filter((r) => r.status === filters.status);
    if (filters.category !== "ALL") next = next.filter((r) => r.category === filters.category);

    if (filters.sortBy === "NEWEST")
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filters.sortBy === "OLDEST")
      next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (filters.sortBy === "MOST_BIDS") next.sort((a, b) => b.bidCount - a.bidCount);

    return next;
  }, [requests, filters]);

  const requesterRequests = useMemo(() => {
    if (!user?.id) return filteredRequests;
    return filteredRequests.filter((request) => !request.requesterId || request.requesterId === user.id);
  }, [filteredRequests, user?.id]);

  const incomingHelperBids = useMemo(() => {
    if (!user?.id) return recentBids;
    return recentBids.filter((bid) => bid.helperId !== user.id);
  }, [recentBids, user?.id]);

  const myBiddingActivity = myBids;

  // Load data on mount
  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // Handle creating a new request
  const handleCreateRequest = async (data: CreateHelpRequestData) => {
    setFormLoading(true);
    try {
      await addNewRequest(data);
      // Refresh home data after new request
      loadHomeData(filters);
    } finally {
      setFormLoading(false);
    }
  };

  const primaryRequest = requests[0];
  const userLocation = [primaryRequest?.city, primaryRequest?.country].filter(Boolean).join(", ") || "N/A";

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Home</Text>
        <Text style={styles.pageSubtitle}>Track requests and bids in one place</Text>
      </View>

      <GreetingOverview
        name={primaryRequest?.requesterName || "User"}
        activeRequests={requests.length}
        recentBids={recentBids.length}
        location={userLocation}
      />

      <Card style={styles.createCard}>
        <Text style={styles.createTitle}>Post a request</Text>
        <Text style={styles.createSubtitle}>Share what you need and get help quickly</Text>
        <RequestForm onSubmit={handleCreateRequest} loading={formLoading} />
      </Card>

      <Card style={styles.filterCard}>
        <RequestFilters filters={filters} updateFilter={updateFilter} resetFilters={resetFilters} />
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Requesting Activity</Text>
          <Text style={styles.sectionCount}>{requesterRequests.length}</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Requests you posted as requester</Text>
        {requesterRequests.length === 0 ? (
          <Text style={styles.emptyText}>No requests found</Text>
        ) : (
          requesterRequests.map((r) => (
            <RequestCard key={r.id} request={r} onDelete={() => loadHomeData(filters)} />
          ))
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bidding Activity</Text>
          <Text style={styles.sectionCount}>{incomingHelperBids.length + myBiddingActivity.length}</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Clear split between helper and requester bid flow</Text>

        <View style={styles.activityBlock}>
          <Text style={styles.activityLabel}>Helpers bidding on your requests</Text>
          <BidList bids={incomingHelperBids} emptyMessage="No helper bids on your requests yet" />
        </View>

        <View style={styles.activityDivider} />

        <View style={styles.activityBlock}>
          <Text style={styles.activityLabel}>Your bids as helper</Text>
          <BidList
            bids={myBiddingActivity}
            emptyMessage="No helper bids available in this feed yet"
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  pageHeader: {
    marginTop: theme.spacing.xs,
  },
  pageTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  pageSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  createCard: {
    borderColor: theme.colors.borderStrong,
  },
  createTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  createSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },
  filterCard: {
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  sectionCard: {
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  sectionCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  sectionSubtitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    paddingVertical: theme.spacing.sm,
  },
  activityBlock: {
    marginBottom: theme.spacing.sm,
  },
  activityLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  activityDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
});