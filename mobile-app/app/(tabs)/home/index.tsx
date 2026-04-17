import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { Screen, Stack, theme } from "@/design-system";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { GreetingOverview } from "@/features/home/components";
import {
  HelpingOpportunitiesSection,
  RequestForm,
} from "@/features/helpRequest/components";
import { BidRequestModal } from "@/features/bid/components";
import { useHomeScreen } from "@/features/home/hooks";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { useCategories } from "@/features/category/hooks/category.hook";

type ActionTileProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  prominent?: boolean;
};

function ActionTile({
  title,
  subtitle,
  icon,
  onPress,
  prominent = false,
}: ActionTileProps) {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: prominent ? palette.primary : palette.surface,
          borderColor: prominent ? palette.primary : palette.border,
          shadowColor: prominent ? palette.primary : "#0f1a12",
          opacity: pressed ? 0.94 : 1,
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

type FilterChipProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
};

function FilterChip({ label, icon, active = false, onPress }: FilterChipProps) {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: active ? palette.primary : palette.surfaceMuted,
          borderColor: active ? palette.primary : palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={active ? palette.textInverse : palette.primary}
        />
      ) : null}
      <Text
        style={[
          styles.filterChipLabel,
          { color: active ? palette.textInverse : palette.textPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const user = useAuthStore((state) => state.user);
  const { value: userLocation } = useLocationPicker({ autoUseCurrentLocationOnMount: true });
  const { categories } = useCategories();

  const {
    filters,
    updateFilter,
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

  const medicalCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === "medical"
  );
  const isMedicalActive = Boolean(
    medicalCategory && filters.categoryId === medicalCategory.id
  );
  const isNearbyActive = filters.radiusKm !== "ANY";

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
          <Stack gap="sm">
            <Pressable
              onPress={() => router.push(APP_ROUTES.HOME_REQUESTS)}
              style={({ pressed }) => [
                styles.browseBanner,
                {
                  backgroundColor: palette.primary,
                  borderColor: "rgba(88, 145, 72, 0.32)",
                  opacity: pressed ? 0.96 : 1,
                },
              ]}
            >
              <View style={styles.browseBannerGlow} />
              <View style={styles.browseBannerHaze} />
              <View style={styles.browseBannerRightFade} />
              <View style={styles.browseBannerCircleGlow} />

              <View style={styles.browseContent}>
                <View
                  style={[
                    styles.browseIconBadge,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  <Ionicons name="search-outline" size={28} color={palette.textInverse} />
                </View>

                <View style={styles.browseCopy}>
                  <Text style={[styles.browseTitle, { color: palette.textInverse }]}>
                    Browse Requests
                  </Text>
                  <Text
                    style={[styles.browseSubtitle, { color: "rgba(255,255,255,0.86)" }]}
                  >
                    View on map or list
                  </Text>
                </View>
              </View>

              <View style={styles.mapPreview}>
                <View style={styles.mapPreviewGradient} />
                <View style={styles.mapPreviewSheen} />
                <View style={styles.mapPreviewGlass} />
                <View style={styles.mapFrame}>
                  <View style={styles.mapFrameInner}>
                    <View style={styles.mapRoadHorizontal} />
                    <View style={styles.mapRoadVertical} />
                    <View style={styles.mapRoadDiagonal} />
                    <View style={styles.mapRoadCurved} />
                    <View style={styles.mapRoadCross} />
                    <View style={styles.mapBlockLarge} />
                    <View style={styles.mapBlockMedium} />
                    <View style={styles.mapBlockSmall} />
                    <View style={styles.mapPark} />
                  </View>
                </View>
                <View style={styles.mapPreviewInnerShadow} />
                <View
                  style={[
                    styles.locationPin,
                    { backgroundColor: "#ffffff" },
                  ]}
                >
                  <Ionicons name="location-sharp" size={24} color={palette.primary} />
                </View>
              </View>

              <View
                style={[
                  styles.browseArrow,
                  { backgroundColor: "rgba(255,255,255,0.92)" },
                ]}
              >
                <Ionicons name="chevron-forward" size={20} color={palette.textPrimary} />
              </View>
            </Pressable>

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

            <View style={styles.filterActionRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipGroup}
                style={styles.filterChipRail}
              >
                <FilterChip
                  label="Filter"
                  icon="filter-outline"
                  onPress={() => router.push(APP_ROUTES.HOME_REQUESTS)}
                />

                <FilterChip
                  label="Nearby"
                  active={isNearbyActive}
                  onPress={() =>
                    updateFilter("radiusKm", isNearbyActive ? "ANY" : "10")
                  }
                />
              </ScrollView>

              <View style={styles.requestFormWrapper}>
                <RequestForm
                  compactTrigger
                  onSubmit={handleCreateRequest}
                  loading={creatingRequest}
                  error={createRequestError}
                />
              </View>
            </View>
          </Stack>
        </View>
      </Stack>

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
    gap: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    columnGap: 12,
  },
  halfTile: {
    flex: 1,
  },
  tile: {
    minHeight: 96,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  browseBanner: {
    minHeight: 132,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "center",
    shadowColor: "#5f9c4c",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  browseBannerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  browseBannerHaze: {
    position: "absolute",
    right: -34,
    top: -30,
    width: 288,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  browseBannerRightFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "44%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  browseBannerCircleGlow: {
    position: "absolute",
    right: 40,
    top: -26,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(202, 231, 192, 0.28)",
  },
  browseContent: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    zIndex: 2,
    maxWidth: "54%",
  },
  browseIconBadge: {
    width: 58,
    height: 58,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#ffffff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  browseCopy: {
    flexShrink: 1,
    gap: 4,
  },
  browseTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: theme.typography.fontWeight.bold,
  },
  browseSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: theme.typography.fontWeight.medium,
  },
  mapPreview: {
    position: "absolute",
    right: 40,
    top: 16,
    bottom: 16,
    width: "31%",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    overflow: "hidden",
    opacity: 0.96,
    shadowColor: "#2d5130",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 4,
  },
  mapPreviewGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  mapPreviewSheen: {
    position: "absolute",
    top: -16,
    right: -8,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mapPreviewGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  mapPreviewInnerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  mapFrame: {
    position: "absolute",
    right: -12,
    top: 10,
    bottom: 10,
    width: "88%",
    borderRadius: 22,
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(241, 247, 239, 0.78)",
    overflow: "hidden",
  },
  mapFrameInner: {
    flex: 1,
    backgroundColor: "rgba(233, 241, 231, 1)",
  },
  mapRoadHorizontal: {
    position: "absolute",
    top: "34%",
    left: -12,
    right: -12,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.88)",
    transform: [{ rotate: "8deg" }],
  },
  mapRoadVertical: {
    position: "absolute",
    top: -6,
    bottom: -10,
    left: "48%",
    width: 16,
    backgroundColor: "rgba(255,255,255,0.86)",
    transform: [{ rotate: "12deg" }],
  },
  mapRoadDiagonal: {
    position: "absolute",
    top: "58%",
    left: -8,
    width: "78%",
    height: 14,
    backgroundColor: "rgba(255,255,255,0.74)",
    transform: [{ rotate: "-28deg" }],
  },
  mapRoadCurved: {
    position: "absolute",
    top: 18,
    right: -12,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 14,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "transparent",
  },
  mapRoadCross: {
    position: "absolute",
    bottom: 28,
    right: 18,
    width: 78,
    height: 14,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.78)",
    transform: [{ rotate: "-12deg" }],
  },
  mapBlockLarge: {
    position: "absolute",
    left: 18,
    top: 14,
    width: 44,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(207, 225, 203, 0.9)",
  },
  mapBlockMedium: {
    position: "absolute",
    right: 48,
    top: 74,
    width: 42,
    height: 28,
    borderRadius: 11,
    backgroundColor: "rgba(213, 229, 210, 0.78)",
  },
  mapBlockSmall: {
    position: "absolute",
    left: 20,
    bottom: 22,
    width: 50,
    height: 30,
    borderRadius: 18,
    backgroundColor: "rgba(206, 226, 201, 0.84)",
  },
  mapPark: {
    position: "absolute",
    left: "44%",
    top: "44%",
    width: 52,
    height: 38,
    marginLeft: -26,
    marginTop: -19,
    borderRadius: 22,
    backgroundColor: "rgba(186, 219, 178, 0.92)",
  },
  locationPin: {
    position: "absolute",
    left: "52%",
    top: "49%",
    marginLeft: -18,
    marginTop: -22,
    width: 36,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: "#3f6b37",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  browseArrow: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    shadowColor: "#20301b",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  tileContent: {
    flex: 1,
    gap: 4,
  },
  tileTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  tileSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 16,
  },
  filterActionRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  filterChipRail: {
    flex: 1,
  },
  filterChipGroup: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },
  filterChip: {
    minHeight: 40,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipLabel: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  requestFormWrapper: {
    flexShrink: 0,
    alignSelf: "center",
  },
});
