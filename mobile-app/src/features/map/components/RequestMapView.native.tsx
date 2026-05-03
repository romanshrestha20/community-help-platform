import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView from "react-native-maps";

import { Card, Stack, theme } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.native";
import { SelectedRequestSheet } from "@/features/map/components/SelectedRequestSheet";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { MapRequestItem, type Coordinates } from "@/features/map/types/map.types";

type Props = {
  requests: MapRequestItem[];
  loading: boolean;
  error?: string | null;
  userLocation?: Coordinates | null;
  onOpenRequest: (requestId: string) => void;
  onBidRequest?: (request: MapRequestItem) => void;
  onSearchArea?: () => Promise<void> | void;
};

const toFiniteCoordinate = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const hasValidCoordinate = (request: MapRequestItem) => {
  const latitude = toFiniteCoordinate(request.location?.latitude);
  const longitude = toFiniteCoordinate(request.location?.longitude);

  return (
    latitude != null &&
    longitude != null &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
};

export const RequestMapView: React.FC<Props> = ({
  requests,
  loading,
  error,
  userLocation,
  onOpenRequest,
  onBidRequest,
  onSearchArea,
}) => {
  const { palette } = useThemeContext();
  const mapRef = useRef<MapView | null>(null);
  const lastRegionRef = useRef<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const {
    location,
    loading: locationLoading,
    permissionDenied,
    error: locationError,
    reload: reloadLocation,
  } = useCurrentLocation();

  const resolvedUserLocation = userLocation ?? location ?? null;
  const mappedRequests = useMemo(
    () => requests.filter((request) => request.status === "OPEN").filter(hasValidCoordinate),
    [requests]
  );

  useEffect(() => {
    setSelectedRequest((current) => {
      if (!current) return null;
      return mappedRequests.find((request) => request.id === current.id) ?? null;
    });
  }, [mappedRequests]);

  const handleRecenter = async () => {
    const fallbackCenter =
      resolvedUserLocation ??
      (mappedRequests[0]?.location
        ? {
            latitude: Number(mappedRequests[0].location.latitude),
            longitude: Number(mappedRequests[0].location.longitude),
          }
        : null);

    if (!mapRef.current || !fallbackCenter) return;

    const nextRegion = {
      latitude: fallbackCenter.latitude,
      longitude: fallbackCenter.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
    mapRef.current.animateToRegion(nextRegion, 450);
    lastRegionRef.current = nextRegion;
    setShowSearchAreaButton(false);

    await reloadLocation();
  };
  const handleRegionChangeComplete = (
    region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number },
    isGesture?: boolean
  ) => {
    const prev = lastRegionRef.current;
    lastRegionRef.current = region;
    if (!isGesture) return;
    if (!prev) {
      setShowSearchAreaButton(true);
      return;
    }
    const movedEnough =
      Math.abs(region.latitude - prev.latitude) > 0.002 ||
      Math.abs(region.longitude - prev.longitude) > 0.002 ||
      Math.abs(region.latitudeDelta - prev.latitudeDelta) > 0.01 ||
      Math.abs(region.longitudeDelta - prev.longitudeDelta) > 0.01;
    if (movedEnough) {
      setShowSearchAreaButton(true);
    }
  };

  const handleSearchArea = async () => {
    setShowSearchAreaButton(false);
    if (onSearchArea) {
      await onSearchArea();
      return;
    }
    await reloadLocation();
  };

  const mapError = error ?? locationError;
  const hasOpenRequests = requests.length > 0;
  const showCoordinateEmptyState = hasOpenRequests && mappedRequests.length === 0;

  if ((loading || locationLoading) && mappedRequests.length === 0 && !resolvedUserLocation) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={palette.primary} />
        <Text style={[styles.centerStateText, { color: palette.textSecondary }]}>Loading map…</Text>
      </View>
    );
  }

  if (permissionDenied && !resolvedUserLocation) {
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
          <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>Map unavailable</Text>
          <Text style={[styles.stateBody, { color: palette.textSecondary }]}>Check location permission or Google Maps configuration.</Text>
          <AppButton title="Use my location" variant="primary" onPress={reloadLocation} />
        </Stack>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <RequestMap
        mapRef={mapRef}
        userLocation={resolvedUserLocation}
        requests={mappedRequests}
        selectedRequestId={selectedRequest?.id ?? null}
        onSelectRequest={setSelectedRequest}
        onPressMap={() => setSelectedRequest(null)}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => setMapReady(true)}
      />

      <MapFloatingActions
        mappedCount={mappedRequests.length}
        onPressRecenter={handleRecenter}
        onPressSearchArea={handleSearchArea}
        showSearchAreaButton={showSearchAreaButton}
      />

      {loading || !mapReady ? (
        <View style={[styles.loadingBadge, { backgroundColor: "rgba(255,255,255,0.94)" }]}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.loadingBadgeText, { color: palette.textPrimary }]}>
            {mapReady ? "Updating map" : "Loading map tiles"}
          </Text>
        </View>
      ) : null}

      {selectedRequest ? (
        <SelectedRequestSheet
          request={selectedRequest}
          onViewDetails={() => onOpenRequest(selectedRequest.id)}
          onBidRequest={onBidRequest ? () => onBidRequest(selectedRequest) : undefined}
        />
      ) : null}

      {!loading && !mapError && requests.length === 0 ? (
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No open requests match these filters.</Text>
      ) : null}

      {!loading && !mapError && showCoordinateEmptyState ? (
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No requests can be shown on the map because they are missing location coordinates.</Text>
      ) : null}

      {mapError ? <Text style={[styles.errorText, { color: palette.danger }]}>Map unavailable. {mapError}</Text> : null}
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
    borderWidth: 1,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  stateBody: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  loadingBadge: {
    position: "absolute",
    top: theme.spacing.md,
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  loadingBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md * 8,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md * 8,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
});
