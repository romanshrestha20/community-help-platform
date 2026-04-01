import React from "react";
import { StyleSheet } from "react-native";
import { Screen, Card, theme } from "@/design-system";
import {
  HelpingOpportunitiesSection,
  RequestFilters,
  RequestForm,
} from "@/features/helpRequest/components";
import { BidRequestModal } from "@/features/bid/components";
import {
  HomeHeader,
} from "@/features/home/components";
import { useHomeScreen } from "@/features/home/hooks";

export default function Home() {
  const {
    filters,
    updateFilter,
    resetFilters,
    helperRequests,
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
      <HomeHeader subtitle="Browse requests posted by others and place bids" />

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