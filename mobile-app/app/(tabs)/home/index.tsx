import React from "react";
import { StyleSheet } from "react-native";
import { Screen, Card, theme } from "@/design-system";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  HelpingOpportunitiesSection,
  RequestFilters,
  RequestForm,
} from "@/features/helpRequest/components";
import { BidRequestModal } from "@/features/bid/components";
import { GreetingOverview } from "@/features/home/components";
import { useHomeScreen } from "@/features/home/hooks";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const {
    filters,
    updateFilter,
    resetFilters,
    helperRequests,
    recentBids,
    creatingRequest,
    createRequestError,
    handleCreateRequest,
    bidModalVisible,
    selectedRequest,
    submittingBid,
    bidError,
    openBidModal,
    closeBidModal,
    handleSubmitBid,
  } = useHomeScreen();

  return (
    <Screen contentContainerStyle={styles.container}>
      <GreetingOverview
        name={user?.fullName || user?.profile?.fullName || "User"}
        location={
          user?.profile?.address?.city ||
          user?.profile?.address?.state ||
          user?.profile?.address?.country ||
          "Set your location"
        }
        activeRequests={helperRequests.length}
        recentBids={recentBids.length}
      />

      <RequestForm
        onSubmit={handleCreateRequest}
        loading={creatingRequest}
        error={createRequestError}
      />

      <Card style={styles.filterCard}>
        <RequestFilters filters={filters} updateFilter={updateFilter} resetFilters={resetFilters} />
      </Card>

      <HelpingOpportunitiesSection requests={helperRequests} onPressBid={openBidModal} />

      <BidRequestModal
        visible={bidModalVisible}
        selectedRequest={selectedRequest}
        onClose={closeBidModal}
        onSubmit={handleSubmitBid}
        loading={submittingBid}
        error={bidError}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  filterCard: {
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
});