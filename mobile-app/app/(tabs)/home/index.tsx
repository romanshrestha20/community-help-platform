import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { Screen, Stack, theme } from "@/design-system";
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
import { APP_ROUTES } from "@/config/routes";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";

type ActionTileProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  prominent?: boolean;
  fullWidth?: boolean;
};

function ActionTile({
  title,
  subtitle,
  icon,
  onPress,
  prominent = false,
  fullWidth = false,
}: ActionTileProps) {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        fullWidth && styles.tileFullWidth,
        {
          backgroundColor: prominent ? palette.primary : palette.surface,
          borderColor: prominent ? palette.primary : palette.border,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: prominent
              ? "rgba(255,255,255,0.18)"
              : palette.background,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={prominent ? palette.textInverse : palette.primary}
        />
      </View>

      <View style={styles.tileContent}>
        <Text
          style={[
            styles.tileTitle,
            { color: prominent ? palette.textInverse : palette.textPrimary },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.tileSubtitle,
              { color: prominent ? palette.textInverse : palette.textSecondary },
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={prominent ? palette.textInverse : palette.textSecondary}
      />
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { value: userLocation } = useLocationPicker({ autoUseCurrentLocationOnMount: true });

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

      <Stack gap="md">
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick actions</Text>

          <Stack gap="sm">
            <ActionTile
              title="Browse Requests"
              subtitle="Explore nearby help opportunities"
              icon="search-outline"
              onPress={() => router.push(APP_ROUTES.HOME_REQUESTS)}
              prominent
              fullWidth
            />

            <View style={styles.actionsRow}>
              <View style={styles.halfTile}>
                <ActionTile
                  title="My Requests"
                  subtitle="Track your posted requests"
                  icon="document-text-outline"
                  onPress={() => router.push(APP_ROUTES.PROFILE_REQUESTS)}
                />
              </View>

              <View style={styles.halfTile}>
                <ActionTile
                  title="My Bids"
                  subtitle="Manage your offers"
                  icon="pricetags-outline"
                  onPress={() => router.push(APP_ROUTES.PROFILE_BIDS)}
                />
              </View>
            </View>

            <View style={styles.requestFormWrapper}>
              <RequestForm
                compactTrigger
                onSubmit={handleCreateRequest}
                loading={creatingRequest}
                error={createRequestError}
              />
            </View>
          </Stack>
        </View>
      </Stack>

      <RequestFilters
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
      />

      <HelpingOpportunitiesSection
        requests={helperRequests}
        myBids={myBids}
        onPressBid={openBidModal}
        onRemoveBid={(request) => void handleRemoveBid(request.id)}
        userLocation={userLocation}
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
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  quickActionsSection: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionsRow: {
    flexDirection: "row",
    columnGap: theme.spacing.sm,
  },
  halfTile: {
    flex: 1,
  },
  tile: {
    minHeight: 76,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing.sm,
  },
  tileFullWidth: {
    minHeight: 84,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tileContent: {
    flex: 1,
    gap: 2,
  },
  tileTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tileSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  requestFormWrapper: {
    marginTop: theme.spacing.xs,
  },
});