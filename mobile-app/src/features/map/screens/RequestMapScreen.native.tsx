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
import { SearchField } from "@/components/ui/SearchField";
import { theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCategories } from "@/features/category/hooks/category.hook";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useRequestSearch } from "@/features/helpRequest/hooks/useRequestSearch";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.native";
import { SelectedRequestPreviewCard } from "@/features/map/components/SelectedRequestPreviewCard";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { useRequestMap } from "@/features/map/hooks/useRequestMap";
import { MapRequestFilters, MapRequestItem } from "@/features/map/types/map.types";

type CategoryChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100] as const;

function CategoryChip({ label, active = false, onPress }: CategoryChipProps) {
  const { palette } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryChip,
        {
          backgroundColor: active ? palette.primary : palette.surfaceSecondary,
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
  const authUser = useAuthStore((state) => state.user);
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
  const openCount = requests.filter((item) => item.status === "OPEN").length;
  const countLabel = `${openCount} open requests nearby`;

  const selectedOwnedByUser = Boolean(
    selectedRequest && authUser && selectedRequest.requesterId === authUser.id
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}> 
      <View style={styles.headerWrap}>
        <RowHeader
          title="Nearby Requests"
          subtitle={countLabel}
          onBack={() => router.replace(APP_ROUTES.HOME_REQUESTS)}
        />

        <View
          style={[
            styles.filtersCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title, category, or location"
          />

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
            <CategoryChip
              label="Nearby"
              active={searchFilters.radiusKm === "10"}
              onPress={() => updateFilter("radiusKm", "10")}
            />
            <CategoryChip
              label="Urgent"
              active={searchFilters.status === "OPEN"}
              onPress={() => updateFilter("status", searchFilters.status === "OPEN" ? "ALL" : "OPEN")}
            />
            {categories.slice(0, 4).map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                active={searchFilters.categoryId === category.id}
                onPress={() => updateFilter("categoryId", category.id)}
              />
            ))}
          </ScrollView>

          <View style={styles.compactControlsRow}>
            <View style={styles.mapToggleWrap}>
              <Pressable
                style={[styles.modeButton, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}
                onPress={() => router.replace(APP_ROUTES.HOME_REQUESTS)}
              >
                <Ionicons name="list-outline" size={18} color={palette.textSecondary} />
                <Text style={[styles.modeButtonText, { color: palette.textSecondary }]}>List</Text>
              </Pressable>
              <View style={[styles.modeButtonActive, { backgroundColor: palette.surface, borderColor: palette.borderStrong }]}>
                <Ionicons name="map-outline" size={18} color={palette.textPrimary} />
                <Text style={[styles.modeButtonText, { color: palette.textPrimary }]}>Map</Text>
              </View>
            </View>

            <Pressable
              onPress={resetSearch}
              style={[styles.filterReset, { borderColor: palette.border, backgroundColor: palette.surfaceSecondary }]}
            >
              <Ionicons name="options-outline" size={18} color={palette.textSecondary} />
              <Text style={[styles.modeButtonText, { color: palette.textSecondary }]}>Filter</Text>
            </Pressable>
          </View>

          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS_KM.map((radius) => {
              const radiusValue = String(radius) as "5" | "10" | "25" | "50" | "100";
              const active = searchFilters.radiusKm === radiusValue;
              return (
                <Pressable
                  key={radius}
                  onPress={() => updateFilter("radiusKm", radiusValue)}
                  style={[
                    styles.radiusChip,
                    {
                      backgroundColor: active ? palette.primary : palette.surfaceSecondary,
                      borderColor: active ? palette.primary : palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.radiusChipText, { color: active ? palette.textInverse : palette.textSecondary }]}> 
                    {radius}km
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.mapCard, { borderColor: palette.border }]}> 
        {locationLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={palette.primary} />
            <Text style={[styles.centerStateText, { color: palette.textSecondary }]}>Locating nearby requests...</Text>
          </View>
        ) : permissionDenied ? (
          <View style={[styles.stateCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>Location permission is required</Text>
            <Text style={[styles.stateBody, { color: palette.textSecondary }]}>Allow location access to show nearby requests on the map.</Text>
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
              selectedRequestId={selectedRequest?.id ?? null}
              onSelectRequest={setSelectedRequest}
              onPressMap={() => setSelectedRequest(null)}
            />

            <MapFloatingActions mappedCount={requests.length} onPressRecenter={handleRecenter} />

            {requestsLoading ? (
              <View style={[styles.loadingBadge, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={[styles.loadingBadgeText, { color: palette.textPrimary }]}>Updating map</Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {selectedRequest ? (
        <SelectedRequestPreviewCard
          request={selectedRequest}
          isOwner={selectedOwnedByUser}
          onDetails={() => router.push(APP_ROUTES.HOME_REQUEST_DETAILS(selectedRequest.id))}
          onPrimary={() => {
            if (selectedOwnedByUser && selectedRequest.status === "OPEN") {
              router.push(APP_ROUTES.HOME_REQUEST_EDIT(selectedRequest.id));
              return;
            }
            router.push(APP_ROUTES.HOME_REQUEST_DETAILS(selectedRequest.id));
          }}
        />
      ) : null}

      {!selectedRequest && !locationLoading && !requestsLoading && requests.length === 0 ? (
        <View style={[styles.emptyToast, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.emptyToastText, { color: palette.textPrimary }]}>No requests in this area</Text>
        </View>
      ) : null}

      {screenError ? (
        <Text style={[styles.errorText, { color: palette.danger }]}>{screenError}</Text>
      ) : null}
    </View>
  );
}

const RowHeader = ({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onBack} style={[styles.backButton, { borderColor: palette.border, backgroundColor: palette.surfaceSecondary }]}>
        <Ionicons name="chevron-back" size={22} color={palette.textPrimary} />
      </Pressable>
      <View>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{title}</Text>
        <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  headerWrap: {
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.fill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 52 / 2,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  filtersCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  categoryRail: {
    gap: theme.spacing.sm,
  },
  categoryChip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  compactControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  mapToggleWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.fill,
    padding: 4,
    gap: 6,
  },
  modeButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modeButtonActive: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modeButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  filterReset: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radiusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  radiusChip: {
    minHeight: 32,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radiusChipText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mapCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: theme.colors.primaryLight,
    minHeight: 260,
  },
  stateCard: {
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  stateBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
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
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyToast: {
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "center",
  },
  emptyToastText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.xs,
  },
});
