import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Screen, Row, Stack, theme } from "@/design-system";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  HelpingOpportunitiesSection,
  RequestFilters,
  RequestForm,
} from "@/features/helpRequest/components";
import { BidRequestModal } from "@/features/bid/components";
import { useHomeScreen } from "@/features/home/hooks";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { formatShortAddress } from "@/features/location/components/LocationPickerField";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";

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
  const { palette } = useThemeContext();
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

  const displayName = user?.fullName || user?.profile?.fullName || "User";
  const firstName = displayName.split(" ")[0] || displayName;
  const locationPicker = useLocationPicker({
    initialValue: user?.profile?.address ?? null,
    autoUseCurrentLocationOnMount: false,
  });
  const locationText = formatShortAddress(locationPicker.value ?? user?.profile?.address ?? null);
  const hasLocation = Boolean(locationPicker.value ?? user?.profile?.address);

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={[styles.greeting, { color: palette.textPrimary }]}>Hi, {firstName}</Text>
        <Row justify="space-between" align="center" style={styles.locationRow}>
          <Text style={[styles.location, { color: palette.textSecondary }]} numberOfLines={1}>
            {locationText}
          </Text>
          <Pressable
            onPress={locationPicker.useCurrentLocation}
            disabled={locationPicker.loading}
            style={({ pressed }) => [styles.locationAction, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Ionicons name="locate-outline" size={15} color={palette.textSecondary} />
            <Text style={[styles.locationActionText, { color: palette.textSecondary }]}>
              {locationPicker.loading ? "Locating" : hasLocation ? "Update" : "Set"}
            </Text>
          </Pressable>
        </Row>
        {locationPicker.error ? (
          <Text style={[styles.locationError, { color: palette.danger }]} numberOfLines={2}>
            {locationPicker.error}
          </Text>
        ) : null}
      </View>

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
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  headerBlock: {
    marginTop: 2,
    gap: theme.spacing.xxs,
  },
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  location: {
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
  },
  locationRow: {
    columnGap: theme.spacing.sm,
  },
  locationAction: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  locationActionText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  locationError: {
    fontSize: theme.typography.fontSize.xs,
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