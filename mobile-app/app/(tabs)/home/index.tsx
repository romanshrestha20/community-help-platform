import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Screen, Row, Stack, theme } from "@/design-system";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { GreetingOverview } from "@/features/home/components";
import {
  HelpingOpportunitiesSection,
  RequestFilters,
  RequestForm,
} from "@/features/helpRequest/components";
import { BidRequestModal } from "@/features/bid/components";
import { useHomeScreen } from "@/features/home/hooks";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type ActionTileProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  prominent?: boolean;
};

function ActionTile({ title, icon, onPress, prominent = false }: ActionTileProps) {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: prominent ? palette.primary : palette.surface,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={prominent ? palette.textInverse : palette.textPrimary}
      />
      <Text
        style={[
          styles.tileText,
          { color: prominent ? palette.textInverse : palette.textPrimary },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    filters,
    updateFilter,
    resetFilters,
    helperRequests,
    myBids,
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
    handleRemoveBid,
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
        avatarUrl={user?.avatarUrl}
        activeRequests={helperRequests.length}
        recentBids={recentBids.length}
        showActions={false}
      />

      <Stack gap="sm">
        <ActionTile
          title="Browse Requests"
          icon="search-outline"
          onPress={() => router.push("/home/requests")}
          prominent
        />

        <Row style={styles.actionsGrid}>
          <View style={styles.actionItemSecondary}>
            <ActionTile
              title="My Requests"
              icon="document-text-outline"
              onPress={() => router.push("/profile/requests")}
            />
          </View>
          <View style={styles.actionItemSecondary}>
            <ActionTile
              title="My Bids"
              icon="pricetags-outline"
              onPress={() => router.push("/profile/bids")}
            />
          </View>
          <View style={styles.actionItemSecondary}>
            <RequestForm
              compactTrigger
              onSubmit={handleCreateRequest}
              loading={creatingRequest}
              error={createRequestError}
            />
          </View>
        </Row>
      </Stack>

      <RequestFilters filters={filters} updateFilter={updateFilter} resetFilters={resetFilters} />

      <HelpingOpportunitiesSection
        requests={helperRequests}
        myBids={myBids}
        onPressBid={openBidModal}
        onRemoveBid={(request) => void handleRemoveBid(request.id)}
      />

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
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  tile: {
    height: 48,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: theme.spacing.xs,
  },
  tileText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionsGrid: {
    flexWrap: "wrap",
    rowGap: theme.spacing.xs,
    columnGap: theme.spacing.sm,
  },
  actionItemSecondary: {
    width: "31%",
  },
});