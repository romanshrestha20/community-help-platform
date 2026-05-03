import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.web";
import { SelectedRequestSheet } from "@/features/map/components/SelectedRequestSheet";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { MapRequestItem, type Coordinates } from "@/features/map/types/map.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

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
}) => {
  const { palette } = useThemeContext();
  const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);
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
          <Text style={[styles.stateBody, { color: palette.textSecondary }]}>Check location permission or map configuration.</Text>
          <Pressable
            onPress={reloadLocation}
            style={[styles.primaryButton, { backgroundColor: palette.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: palette.textInverse }]}>Use my location</Text>
          </Pressable>
        </Stack>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <RequestMap
        userLocation={resolvedUserLocation}
        requests={mappedRequests}
        selectedRequestId={selectedRequest?.id ?? null}
        onSelectRequest={setSelectedRequest}
        onPressMap={() => setSelectedRequest(null)}
      />

      <MapFloatingActions mappedCount={mappedRequests.length} onPressRecenter={handleRecenter} />

      {loading ? (
        <View style={[styles.loadingBadge, { backgroundColor: "rgba(255,255,255,0.94)" }]}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.loadingBadgeText, { color: palette.textPrimary }]}>Updating map…</Text>
        </View>
      ) : null}

      {mapError ? (
        <Card
          style={[
            styles.errorCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.errorTitle, { color: palette.textPrimary }]}>Map unavailable</Text>
          <Text style={[styles.errorBody, { color: palette.textSecondary }]}>{mapError}</Text>
        </Card>
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
  primaryButton: {
    minHeight: 42,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
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
  errorCard: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    top: theme.spacing.md * 4,
    borderRadius: 18,
    borderWidth: 1,
    padding: theme.spacing.md,
    rowGap: theme.spacing.xs,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 18,
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
});
