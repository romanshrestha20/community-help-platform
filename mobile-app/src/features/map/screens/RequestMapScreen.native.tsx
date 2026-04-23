import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import type MapView from "react-native-maps";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { SearchField } from "@/components/ui/SearchField";
import { ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useCategories } from "@/features/category/hooks/category.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useRequestSearch } from "@/features/helpRequest/hooks/useRequestSearch";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.native";
import { SelectedRequestSheet } from "@/features/map/components/SelectedRequestSheet";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { useRequestMap } from "@/features/map/hooks/useRequestMap";
import { MapRequestFilters, MapRequestItem } from "@/features/map/types/map.types";

type CategoryChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

function CategoryChip({ label, active = false, onPress }: CategoryChipProps) {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryChip,
        {
          backgroundColor: active ? palette.primary : palette.surface,
          borderColor: active ? palette.primary : palette.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.categoryChipText,
          { color: active ? palette.textInverse : palette.textPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function RequestMapScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const {
    buildParams,
    filters: searchFilters,
    searchQuery,
    setSearchQuery,
    updateFilter,
    resetSearch,
  } = useRequestSearch();
  const { categories } = useCategories();
  const mapRef = useRef<MapView | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);

  const {
    location,
    loading: locationLoading,
    permissionDenied,
    error: locationError,
    reload: reloadLocation,
  } = useCurrentLocation();

  const mapFilters = useMemo<MapRequestFilters>(() => {
    const params = buildParams({
      latitude: location?.latitude,
      longitude: location?.longitude,
    });

    return {
      latitude: typeof params.latitude === "number" ? params.latitude : undefined,
      longitude: typeof params.longitude === "number" ? params.longitude : undefined,
      categoryId: typeof params.categoryId === "string" ? params.categoryId : null,
      search: typeof params.search === "string" ? params.search : undefined,
      status: (params.status as MapRequestFilters["status"]) ?? null,
      radiusKm: searchFilters.radiusKm === "ANY" ? undefined : Number(searchFilters.radiusKm),
    };
  }, [buildParams, location?.latitude, location?.longitude, searchFilters.radiusKm]);

  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    reload: reloadRequests,
  } = useRequestMap(mapFilters, {
    autoFetch: Boolean(location),
  });

  useEffect(() => {
    setSelectedRequest((current) => {
      if (!current) return null;
      return requests.find((request) => request.id === current.id) ?? null;
    });
  }, [requests]);

  const handleRecenter = () => {
    if (!mapRef.current || !location) return;

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      450
    );
  };

  const handleReload = async () => {
    await reloadLocation();
    await reloadRequests();
  };

  const screenError = locationError ?? requestsError ?? null;
  const shouldShowEmptyState =
    !locationLoading &&
    !requestsLoading &&
    !permissionDenied &&
    !locationError &&
    requests.length === 0;

  return (
    <ScreenView style={styles.screen}>
      <AppHeader
        title="Request map"
        subtitle="Explore nearby requests geographically."
        showBackButton
        backButtonProps={{
          fallback: APP_ROUTES.HOME_REQUESTS,
          variant: "secondary",
        }}
        rightAction={{
          icon: "list-outline",
          onPress: () => router.replace(APP_ROUTES.HOME_REQUESTS),
          accessibilityLabel: "Switch to list view",
          color: palette.textPrimary,
        }}
      />

      <View
        style={[
          styles.controlsCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.controlsHeaderRow}>
          <View style={styles.controlsCopy}>
            <Text style={[styles.controlsEyebrow, { color: palette.primary }]}>
              Nearby map
            </Text>
            <Text style={[styles.controlsTitle, { color: palette.textPrimary }]}>
              Search and explore requests by area
            </Text>
          </View>

          <View
            style={[
              styles.resultsPill,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Ionicons name="location-outline" size={14} color={palette.primary} />
            <Text style={[styles.resultsPillText, { color: palette.textPrimary }]}>
              {requests.length}
            </Text>
          </View>
        </View>

        <View style={styles.controlsTopRow}>
          <View style={styles.searchWrap}>
            <SearchField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search requests on the map..."
              containerStyle={styles.searchField}
            />
          </View>

          <Pressable
            onPress={() => router.replace(APP_ROUTES.HOME_REQUESTS)}
            style={({ pressed }) => [
              styles.viewSwitchButton,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.viewSwitchText, { color: palette.textPrimary }]}>
              List
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRail}
        >
          <CategoryChip
            label="All"
            active={searchFilters.categoryId === "ALL"}
            onPress={() => updateFilter("categoryId", "ALL")}
          />
          {categories.slice(0, 5).map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              active={searchFilters.categoryId === category.id}
              onPress={() => updateFilter("categoryId", category.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.secondaryActionsRow}>
          <Pressable
            onPress={() =>
              updateFilter(
                "radiusKm",
                searchFilters.radiusKm === "10" ? "ANY" : "10"
              )
            }
            style={({ pressed }) => [
              styles.secondaryActionButton,
              {
                backgroundColor:
                  searchFilters.radiusKm === "10"
                    ? `${palette.primary}14`
                    : palette.surfaceMuted,
                borderColor:
                  searchFilters.radiusKm === "10" ? palette.primary : palette.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.secondaryActionText,
                {
                  color:
                    searchFilters.radiusKm === "10"
                      ? palette.primary
                      : palette.textSecondary,
                },
              ]}
            >
              10 km radius
            </Text>
          </Pressable>

          <View
            style={[
              styles.selectionSummary,
              { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.selectionSummaryText, { color: palette.textSecondary }]}>
              {searchFilters.categoryId === "ALL"
                ? "All categories"
                : categories.find((category) => category.id === searchFilters.categoryId)
                    ?.name ?? "Filtered"}
            </Text>
          </View>

          <Pressable
            onPress={resetSearch}
            style={({ pressed }) => [
              styles.secondaryActionButton,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryActionText, { color: palette.textSecondary }]}>
              Reset
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapWrap}>
        {locationLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={palette.primary} />
            <Text style={[styles.centerStateText, { color: palette.textSecondary }]}>
              Locating nearby requests...
            </Text>
          </View>
        ) : permissionDenied ? (
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
              Location permission is required
            </Text>
            <Text style={[styles.stateBody, { color: palette.textSecondary }]}>
              Allow location access to show nearby requests on the map.
            </Text>
            <View style={styles.actionWrap}>
              <AppButton title="Try again" variant="primary" onPress={handleReload} />
            </View>
          </View>
        ) : (
          <>
            <RequestMap
              mapRef={mapRef}
              userLocation={location}
              requests={requests}
              onSelectRequest={setSelectedRequest}
              onPressMap={() => setSelectedRequest(null)}
            />

            <MapFloatingActions
              mappedCount={requests.length}
              onPressRecenter={handleRecenter}
            />

            {requestsLoading ? (
              <View
                style={[
                  styles.loadingBadge,
                  { backgroundColor: "rgba(255,255,255,0.94)" },
                ]}
              >
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={[styles.loadingBadgeText, { color: palette.textPrimary }]}>
                  Updating map
                </Text>
              </View>
            ) : null}

            {selectedRequest ? (
              <SelectedRequestSheet
                request={selectedRequest}
                onViewDetails={() =>
                  router.push(APP_ROUTES.HOME_REQUEST_DETAILS(selectedRequest.id))
                }
              />
            ) : null}
          </>
        )}
      </View>

      {shouldShowEmptyState ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
            No requests match this map view
          </Text>
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
            Try another category, clear the search, or widen the radius to see more
            nearby requests.
          </Text>
        </View>
      ) : null}

      {screenError ? (
        <Text style={[styles.errorText, { color: palette.danger }]}>
          {screenError}
        </Text>
      ) : null}
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  controlsCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  controlsHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  controlsCopy: {
    flex: 1,
    gap: 4,
  },
  controlsEyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  controlsTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 28,
    fontWeight: theme.typography.fontWeight.bold,
  },
  resultsPill: {
    minHeight: 36,
    minWidth: 54,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resultsPillText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  controlsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  searchWrap: {
    flex: 1,
  },
  searchField: {
    minHeight: 48,
    borderRadius: 18,
  },
  viewSwitchButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  viewSwitchText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  categoryRail: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
  },
  categoryChip: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  selectionSummary: {
    flex: 1,
    minHeight: 40,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  selectionSummaryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  secondaryActionButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mapWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    marginTop: theme.spacing.sm,
    backgroundColor: "#DCE8D4",
  },
  stateCard: {
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  stateBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  actionWrap: {
    marginTop: theme.spacing.xs,
    alignSelf: "flex-start",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  centerStateText: {
    fontSize: theme.typography.fontSize.sm,
  },
  loadingBadge: {
    position: "absolute",
    top: theme.spacing.xl + 12,
    left: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#122013",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  loadingBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 6,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptyText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 21,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: theme.typography.fontSize.xs,
  },
});
