import React, { useEffect, useMemo, useState } from "react";
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

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { SearchField } from "@/components/ui/SearchField";
import { Row, ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useCategories } from "@/features/category/hooks/category.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useRequestSearch } from "@/features/helpRequest/hooks/useRequestSearch";
import { RequestMap } from "@/features/map/components/RequestMap.web";
import { SelectedRequestSheet } from "@/features/map/components/SelectedRequestSheet";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { useRequestMap } from "@/features/map/hooks/useRequestMap";
import { MapBounds, MapRequestFilters, MapRequestItem } from "@/features/map/types/map.types";

const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100] as const;

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
  const { categories } = useCategories();
  const {
    buildParams,
    filters: searchFilters,
    searchQuery,
    setSearchQuery,
    updateFilter,
    resetSearch,
  } = useRequestSearch();
  const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [centerSignal, setCenterSignal] = useState(0);

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
      bounds,
    };
  }, [bounds, buildParams, location?.latitude, location?.longitude, searchFilters.radiusKm]);

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
    if (!location) return;
    setCenterSignal((current) => current + 1);
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

        <View style={styles.radiusControl}>
          <Row justify="space-between" align="center" gap="sm">
            <Text style={[styles.radiusTitle, { color: palette.textPrimary }]}>
              Radius
            </Text>
            <Text style={[styles.radiusValue, { color: palette.primary }]}>
              {searchFilters.radiusKm === "ANY" ? "Anywhere" : `${searchFilters.radiusKm} km`}
            </Text>
          </Row>

          <View style={styles.radiusTrackRow}>
            {RADIUS_OPTIONS_KM.map((radius) => {
              const radiusValue = String(radius) as "5" | "10" | "25" | "50" | "100";
              const active = searchFilters.radiusKm === radiusValue;

              return (
                <Pressable
                  key={radius}
                  onPress={() => updateFilter("radiusKm", radiusValue)}
                  style={({ pressed }) => [
                    styles.radiusStep,
                    {
                      backgroundColor: active ? palette.primary : palette.surface,
                      borderColor: active ? palette.primary : palette.border,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.radiusStepText,
                      { color: active ? palette.textInverse : palette.textSecondary },
                    ]}
                  >
                    {radius}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => updateFilter("radiusKm", "ANY")}
            style={({ pressed }) => [
              styles.anywhereButton,
              {
                backgroundColor:
                  searchFilters.radiusKm === "ANY"
                    ? `${palette.primary}14`
                    : palette.surface,
                borderColor:
                  searchFilters.radiusKm === "ANY" ? palette.primary : palette.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.anywhereText,
                {
                  color:
                    searchFilters.radiusKm === "ANY"
                      ? palette.primary
                      : palette.textSecondary,
                },
              ]}
            >
              Anywhere
            </Text>
          </Pressable>
        </View>

        <View style={styles.secondaryActionsRow}>
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
              userLocation={location}
              requests={requests}
              selectedRequestId={selectedRequest?.id ?? null}
              onSelectRequest={setSelectedRequest}
              onPressMap={() => setSelectedRequest(null)}
              onBoundsChange={setBounds}
              centerSignal={centerSignal}
            />

            <View style={styles.mapFloatingRow}>
              <Pressable
                onPress={handleRecenter}
                style={[
                  styles.recenterButton,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <Ionicons name="locate-outline" size={18} color={palette.textPrimary} />
              </Pressable>
            </View>

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
            Try another category, clear the search, or widen the radius to see more nearby requests.
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
  radiusControl: {
    borderWidth: 1,
    borderRadius: 16,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  radiusTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  radiusValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  radiusTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radiusStep: {
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  radiusStepText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  anywhereButton: {
    alignSelf: "flex-start",
    minHeight: 30,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  anywhereText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
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
  mapFloatingRow: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  recenterButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
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
