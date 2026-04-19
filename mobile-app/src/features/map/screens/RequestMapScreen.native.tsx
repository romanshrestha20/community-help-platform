import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type MapView from "react-native-maps";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useRequestSearch } from "@/features/helpRequest/hooks/useRequestSearch";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.native";
import { SelectedRequestSheet } from "@/features/map/components/SelectedRequestSheet";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { useRequestMap } from "@/features/map/hooks/useRequestMap";
import { MapRequestFilters, MapRequestItem } from "@/features/map/types/map.types";

export default function RequestMapScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();
  const { buildParams, filters: searchFilters } = useRequestSearch();
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
                onPress={() =>
                  router.push(APP_ROUTES.HOME_REQUEST_DETAILS(selectedRequest.id))
                }
              />
            ) : null}
          </>
        )}
      </View>

      {shouldShowEmptyState ? (
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
          No nearby requests match the current map filters.
        </Text>
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
  mapWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    marginTop: theme.spacing.sm,
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
    top: theme.spacing.xl + 56,
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
  emptyText: {
    marginTop: theme.spacing.sm,
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    textAlign: "center",
    fontSize: theme.typography.fontSize.xs,
  },
});
