import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.web";
import { SelectedRequestSheet } from "@/features/map/components/SelectedRequestSheet";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { useRequestMap } from "@/features/map/hooks/useRequestMap";
import {
  MapBounds,
  Coordinates,
  MapRequestFilters,
  MapRequestItem,
} from "@/features/map/types/map.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  filters: MapRequestFilters;
  onOpenRequest: (requestId: string) => void;
  onBidRequest?: (request: MapRequestItem) => void;
};

const boundsChangedEnough = (a: MapBounds | null, b: MapBounds | null) => {
  if (!a || !b) return false;

  return (
    Math.abs(a.minLatitude - b.minLatitude) > 0.002 ||
    Math.abs(a.maxLatitude - b.maxLatitude) > 0.002 ||
    Math.abs(a.minLongitude - b.minLongitude) > 0.002 ||
    Math.abs(a.maxLongitude - b.maxLongitude) > 0.002
  );
};

export const RequestMapView: React.FC<Props> = ({
  filters,
  onOpenRequest,
  onBidRequest,
}) => {
  const { palette } = useThemeContext();
  const boundsUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);
  const [appliedBounds, setAppliedBounds] = useState<MapBounds | null>(null);
  const [appliedCenter, setAppliedCenter] = useState<Coordinates | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const [pendingCenter, setPendingCenter] = useState<Coordinates | null>(null);
  const [centerSignal, setCenterSignal] = useState(0);

  const {
    location,
    loading: locationLoading,
    permissionDenied,
    error: locationError,
    reload: reloadLocation,
  } = useCurrentLocation();

  const mergedFilters = useMemo<MapRequestFilters>(
    () => ({
      ...filters,
      latitude: appliedCenter?.latitude ?? filters.latitude ?? location?.latitude,
      longitude: appliedCenter?.longitude ?? filters.longitude ?? location?.longitude,
      bounds: appliedBounds,
    }),
    [appliedBounds, appliedCenter, filters, location?.latitude, location?.longitude]
  );

  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    reload: reloadRequests,
  } = useRequestMap(mergedFilters, {
    autoFetch: Boolean(
      mergedFilters.bounds ||
        (mergedFilters.latitude != null && mergedFilters.longitude != null)
    ),
  });

  useEffect(() => {
    setSelectedRequest((current) => {
      if (!current) return null;
      return requests.find((request) => request.id === current.id) ?? null;
    });
  }, [requests]);

  useEffect(() => {
    setAppliedBounds(filters.bounds ?? null);
  }, [filters.bounds]);

  useEffect(() => {
    if (filters.latitude != null && filters.longitude != null) {
      const nextCenter = {
        latitude: filters.latitude,
        longitude: filters.longitude,
      };
      setAppliedCenter(nextCenter);
      setPendingCenter(null);
    } else if (location?.latitude != null && location?.longitude != null) {
      const nextCenter = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      setAppliedCenter(nextCenter);
      setPendingCenter(null);
    }
  }, [filters.latitude, filters.longitude, location?.latitude, location?.longitude]);

  useEffect(() => {
    return () => {
      if (boundsUpdateTimeoutRef.current) {
        clearTimeout(boundsUpdateTimeoutRef.current);
      }
    };
  }, []);

  const handleRecenter = async () => {
    const fallbackCenter =
      (location?.latitude != null && location?.longitude != null)
        ? { latitude: location.latitude, longitude: location.longitude }
        : (filters.latitude != null && filters.longitude != null)
          ? { latitude: filters.latitude, longitude: filters.longitude }
          : null;

    setSelectedRequest(null);
    setAppliedBounds(null);
    setPendingBounds(null);
    setPendingCenter(null);
    if (fallbackCenter) {
      setAppliedCenter(fallbackCenter);
    }
    setCenterSignal((value) => value + 1);
    await reloadLocation();
  };

  const handleReload = async () => {
    await reloadLocation();
    await reloadRequests();
  };

  const handleSearchThisArea = async () => {
    if (!pendingBounds || !pendingCenter) return;

    setAppliedBounds(pendingBounds);
    setAppliedCenter(pendingCenter);
    setPendingBounds(null);
    await reloadRequests();
  };

  const resolvedUserLocation =
    location ??
    (filters.latitude != null && filters.longitude != null
      ? { latitude: filters.latitude, longitude: filters.longitude }
      : null);
  const hasFallbackCenter =
    filters.latitude != null &&
    filters.longitude != null &&
    Number.isFinite(filters.latitude) &&
    Number.isFinite(filters.longitude);
  const showPermissionDeniedState = permissionDenied && !hasFallbackCenter && !location;
  const screenError = requestsError ?? (showPermissionDeniedState ? locationError : null) ?? null;
  const showSearchThisArea = Boolean(
    pendingBounds &&
      pendingCenter &&
      (!appliedBounds || boundsChangedEnough(appliedBounds, pendingBounds))
  );

  if (locationLoading && !resolvedUserLocation) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={palette.primary} />
        <Text style={[styles.centerStateText, { color: palette.textSecondary }]}>
          Locating nearby requests...
        </Text>
      </View>
    );
  }

  if (showPermissionDeniedState) {
    return (
      <Card
        style={[
          styles.stateCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <Stack gap="sm">
          <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
            Location permission is required
          </Text>
          <Text style={[styles.stateBody, { color: palette.textSecondary }]}>
            Allow browser location access to center the map on you, or save a location in your profile to use as a fallback.
          </Text>
          <Pressable
            onPress={handleReload}
            style={[
              styles.primaryButton,
              { backgroundColor: palette.primary },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: palette.textInverse }]}>
              Try again
            </Text>
          </Pressable>
        </Stack>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <RequestMap
        userLocation={resolvedUserLocation}
        requests={requests}
        selectedRequestId={selectedRequest?.id ?? null}
        onSelectRequest={setSelectedRequest}
        onPressMap={() => setSelectedRequest(null)}
        onBoundsChange={(bounds) => {
          if (!pendingBounds || boundsChangedEnough(pendingBounds, bounds)) {
            if (boundsUpdateTimeoutRef.current) {
              clearTimeout(boundsUpdateTimeoutRef.current);
            }

            boundsUpdateTimeoutRef.current = setTimeout(() => {
              const nextCenter = {
                latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
                longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
              };
              setPendingCenter(nextCenter);
              setPendingBounds(bounds);
            }, 280);
          }
        }}
        centerSignal={centerSignal}
      />

      <MapFloatingActions
        mappedCount={requests.length}
        onPressRecenter={handleRecenter}
      />

      {showSearchThisArea ? (
        <View style={styles.searchAreaButtonWrap}>
          <Pressable
            onPress={handleSearchThisArea}
            style={[
              styles.primaryButton,
              { backgroundColor: palette.primary },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: palette.textInverse }]}>
              Search this area
            </Text>
          </Pressable>
        </View>
      ) : null}

      {requestsLoading ? (
        <View
          style={[
            styles.loadingBadge,
            { backgroundColor: "rgba(255,255,255,0.94)" },
          ]}
        >
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.loadingBadgeText, { color: palette.textPrimary }]}>
            Updating map…
          </Text>
        </View>
      ) : null}

      {screenError ? (
        <Card
          style={[
            styles.errorCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.errorTitle, { color: palette.textPrimary }]}>
            Map data could not be loaded
          </Text>
          <Text style={[styles.errorBody, { color: palette.textSecondary }]}>
            {screenError}
          </Text>
          <Pressable
            onPress={handleReload}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
              Retry
            </Text>
          </Pressable>
        </Card>
      ) : null}

      {selectedRequest ? (
        <SelectedRequestSheet
          request={selectedRequest}
          onViewDetails={() => onOpenRequest(selectedRequest.id)}
          onBidRequest={
            onBidRequest ? () => onBidRequest(selectedRequest) : undefined
          }
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    marginTop: theme.spacing.sm,
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
  stateCard: {
    flex: 1,
    justifyContent: "center",
    borderRadius: 24,
    padding: theme.spacing.lg,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  stateBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  primaryButton: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.fill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  loadingBadge: {
    position: "absolute",
    top: theme.spacing.xl * 2 + 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  loadingBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  errorCard: {
    position: "absolute",
    right: theme.spacing.md,
    top: theme.spacing.md,
    width: 280,
    padding: theme.spacing.md,
    borderRadius: 20,
    gap: 10,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  errorBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  searchAreaButtonWrap: {
    position: "absolute",
    top: theme.spacing.md,
    alignSelf: "center",
  },
});
