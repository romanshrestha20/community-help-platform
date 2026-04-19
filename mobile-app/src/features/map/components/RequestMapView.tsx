import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Stack, theme } from "@/design-system";
import { MapFloatingActions } from "@/features/map/components/MapFloatingActions";
import { RequestMap } from "@/features/map/components/RequestMap.web";
import { useCurrentLocation } from "@/features/map/hooks/useCurrentLocation";
import { useRequestMap } from "@/features/map/hooks/useRequestMap";
import {
  MapBounds,
  Coordinates,
  MapRequestFilters,
  MapRequestItem,
} from "@/features/map/types/map.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import {
  formatRequestBudget,
  formatRequestLocation,
  getRequestCategoryLabel,
} from "@/features/helpRequest/utils/requestDisplay";
import { formatDistance } from "@/utils/distance";

type Props = {
  filters: MapRequestFilters;
  onOpenRequest: (requestId: string) => void;
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
}) => {
  const { palette } = useThemeContext();
  const boundsUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MapRequestItem | null>(null);
  const [appliedBounds, setAppliedBounds] = useState<MapBounds | null>(null);
  const [viewportCenter, setViewportCenter] = useState<Coordinates | null>(null);
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
      latitude: viewportCenter?.latitude ?? filters.latitude ?? location?.latitude,
      longitude: viewportCenter?.longitude ?? filters.longitude ?? location?.longitude,
      bounds: appliedBounds,
    }),
    [appliedBounds, filters, location?.latitude, location?.longitude, viewportCenter]
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
      setViewportCenter({
        latitude: filters.latitude,
        longitude: filters.longitude,
      });
    } else if (location?.latitude != null && location?.longitude != null) {
      setViewportCenter({
        latitude: location.latitude,
        longitude: location.longitude,
      });
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
    setSelectedRequest(null);
    setAppliedBounds(null);
    if (location?.latitude != null && location?.longitude != null) {
      setViewportCenter({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
    setCenterSignal((value) => value + 1);
    await reloadLocation();
  };

  const handleReload = async () => {
    await reloadLocation();
    await reloadRequests();
  };

  const screenError = locationError ?? requestsError ?? null;

  if (locationLoading && !location) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={palette.primary} />
        <Text style={[styles.centerStateText, { color: palette.textSecondary }]}>
          Locating nearby requests...
        </Text>
      </View>
    );
  }

  if (permissionDenied) {
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
            Allow browser location access to show nearby requests on the map.
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
        userLocation={location}
        requests={requests}
        selectedRequestId={selectedRequest?.id ?? null}
        onSelectRequest={setSelectedRequest}
        onPressMap={() => setSelectedRequest(null)}
        onBoundsChange={(bounds) => {
          if (!appliedBounds || boundsChangedEnough(appliedBounds, bounds)) {
            if (boundsUpdateTimeoutRef.current) {
              clearTimeout(boundsUpdateTimeoutRef.current);
            }

            boundsUpdateTimeoutRef.current = setTimeout(() => {
              setViewportCenter({
                latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
                longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
              });
              setAppliedBounds(bounds);
            }, 280);
          }
        }}
        centerSignal={centerSignal}
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
        <Pressable
          onPress={() => onOpenRequest(selectedRequest.id)}
          style={({ pressed }) => [
            styles.selectedCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.96 : 1,
            },
          ]}
        >
          <View style={styles.selectedCardHeader}>
            <View style={styles.selectedCardCopy}>
              <Text
                numberOfLines={1}
                style={[styles.selectedCardTitle, { color: palette.textPrimary }]}
              >
                {selectedRequest.title}
              </Text>
              <Text
                style={[styles.selectedCardSubtitle, { color: palette.textSecondary }]}
              >
                {getRequestCategoryLabel(selectedRequest)}
              </Text>
            </View>

            <Text style={[styles.selectedCardBudget, { color: palette.primary }]}>
              {formatRequestBudget(selectedRequest)}
            </Text>
          </View>

          <View style={styles.selectedCardMeta}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <Text style={[styles.statusPillText, { color: palette.textSecondary }]}>
                {selectedRequest.status}
              </Text>
            </View>

            {typeof selectedRequest.distanceKm === "number" ? (
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: `${palette.primary}14` },
                ]}
              >
                <Text style={[styles.statusPillText, { color: palette.primary }]}>
                  {formatDistance(selectedRequest.distanceKm)} away
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            numberOfLines={1}
            style={[styles.selectedCardLocation, { color: palette.textSecondary }]}
          >
            {formatRequestLocation(selectedRequest)}
          </Text>
        </Pressable>
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
  selectedCard: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    borderWidth: 1,
    borderRadius: 22,
    padding: theme.spacing.md,
    shadowColor: "#122013",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  selectedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: theme.spacing.sm,
  },
  selectedCardCopy: {
    flex: 1,
    gap: 4,
  },
  selectedCardTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  selectedCardSubtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  selectedCardBudget: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  selectedCardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  statusPill: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  selectedCardLocation: {
    marginTop: 10,
    fontSize: 13,
  },
});
