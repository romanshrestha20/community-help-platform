import React, { RefObject, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";

import { Coordinates, MapRequestItem } from "@/features/map/types/map.types";
import { getRegionForCoordinates } from "@/features/map/utils/getRegionForCoordinates";
import { isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";

type Props = {
  userLocation: Coordinates | null;
  requests: MapRequestItem[];
  selectedRequestId?: string | null;
  onSelectRequest: (request: MapRequestItem) => void;
  onPressMap?: () => void;
  showsMyLocationButton?: boolean;
  mapRef?: RefObject<MapView | null>;
  onRegionChangeComplete?: (region: Region, isGesture?: boolean) => void;
  onMapReady?: () => void;
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

const getRequestCoordinate = (request: MapRequestItem) => {
  const latitude = toFiniteCoordinate(request.location?.latitude);
  const longitude = toFiniteCoordinate(request.location?.longitude);

  if (
    latitude == null ||
    longitude == null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
};

export const RequestMap: React.FC<Props> = ({
  userLocation,
  requests,
  selectedRequestId,
  onSelectRequest,
  onPressMap,
  showsMyLocationButton = true,
  mapRef,
  onRegionChangeComplete,
  onMapReady,
}) => {
  const internalMapRef = useRef<MapView | null>(null);
  const resolvedMapRef = mapRef ?? internalMapRef;
  const hasAutoCenteredRef = useRef(false);
  const markerPressInFlightRef = useRef(false);
  const suppressNextRegionEventRef = useRef(false);
  const [mapReady, setMapReady] = React.useState(false);

  const validRequests = useMemo(
    () => requests.filter((request) => Boolean(getRequestCoordinate(request))),
    [requests]
  );
  const duplicateCoordinateIndexMap = useMemo(() => {
    const counts = new Map<string, number>();
    const indexes = new Map<string, number>();

    validRequests.forEach((request) => {
      const coordinate = getRequestCoordinate(request);
      if (!coordinate) return;
      const key = `${coordinate.latitude.toFixed(5)}:${coordinate.longitude.toFixed(5)}`;
      const currentCount = counts.get(key) ?? 0;
      counts.set(key, currentCount + 1);
      indexes.set(request.id, currentCount);
    });

    return indexes;
  }, [validRequests]);
  const duplicateCoordinateCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    validRequests.forEach((request) => {
      const coordinate = getRequestCoordinate(request);
      if (!coordinate) return;
      const key = `${coordinate.latitude.toFixed(5)}:${coordinate.longitude.toFixed(5)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [validRequests]);

  const initialRegion = useMemo(
    () => getRegionForCoordinates(userLocation, validRequests),
    [userLocation, validRequests]
  );

  useEffect(() => {
    if (!resolvedMapRef.current || hasAutoCenteredRef.current) return;

    const region = getRegionForCoordinates(userLocation, validRequests);
    suppressNextRegionEventRef.current = true;
    resolvedMapRef.current.animateToRegion(region, 350);
    hasAutoCenteredRef.current = true;
  }, [resolvedMapRef, userLocation, validRequests]);

  useEffect(() => {
    if (!mapReady || !resolvedMapRef.current || validRequests.length === 0) {
      return;
    }

    const coordinates = validRequests
      .map((request) => getRequestCoordinate(request))
      .filter(
        (coordinate): coordinate is { latitude: number; longitude: number } =>
          Boolean(coordinate)
      );

    if (coordinates.length === 0) {
      return;
    }

    suppressNextRegionEventRef.current = true;
    resolvedMapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 90, right: 50, bottom: 180, left: 50 },
      animated: true,
    });
  }, [mapReady, resolvedMapRef, validRequests]);

  return (
    <View style={styles.container}>
      <MapView
        ref={resolvedMapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={showsMyLocationButton}
        onMapReady={() => {
          setMapReady(true);
          onMapReady?.();
        }}
        onPress={() => {
          if (markerPressInFlightRef.current) {
            markerPressInFlightRef.current = false;
            return;
          }
          onPressMap?.();
        }}
        onRegionChangeComplete={(region, details) => {
          const isSuppressed = suppressNextRegionEventRef.current;
          suppressNextRegionEventRef.current = false;
          onRegionChangeComplete?.(region, isSuppressed ? false : details?.isGesture);
        }}
      >
        {validRequests.map((request) => {
          const isUrgentActive =
            request.status === "OPEN" && isUrgentRequestActive(request);
          const isSelected = selectedRequestId === request.id;
          const coordinate = getRequestCoordinate(request);
          if (!coordinate) return null;
          const key = `${coordinate.latitude.toFixed(5)}:${coordinate.longitude.toFixed(5)}`;
          const stackOffset = duplicateCoordinateIndexMap.get(request.id) ?? 0;
          const stackCount = duplicateCoordinateCountMap.get(key) ?? 1;
          if (stackOffset > 0) return null;
          const markerLabel = stackCount > 1
            ? String(stackCount)
            : formatBudgetCompact(request.budget);
          return (
          <Marker
            key={request.id}
            coordinate={coordinate}
            tracksViewChanges={false}
            tracksInfoWindowChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            calloutAnchor={{ x: 0.5, y: 0 }}
            onPress={() => {
              markerPressInFlightRef.current = true;
              onSelectRequest(request);
            }}
          >
            <View
              style={[
                styles.priceMarker,
                isUrgentActive ? styles.priceMarkerUrgent : styles.priceMarkerNormal,
                stackCount > 1 ? styles.priceMarkerCluster : null,
                isSelected ? styles.priceMarkerSelected : null,
              ]}
            >
              <Text style={styles.priceMarkerText}>{markerLabel}</Text>
            </View>
          </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  priceMarker: {
    minWidth: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#0c1f1a",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 8,
  },
  priceMarkerNormal: {
    backgroundColor: "#37B895",
    borderColor: "#1F8E72",
  },
  priceMarkerUrgent: {
    backgroundColor: "#E24B61",
    borderColor: "#B83046",
  },
  priceMarkerSelected: {
    minWidth: 52,
    height: 52,
transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  priceMarkerCluster: {
    minWidth: 48,
    paddingHorizontal: 10,
  },
  priceMarkerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
});

const formatBudgetCompact = (budget?: number | null) => {
  if (typeof budget !== "number" || Number.isNaN(budget)) {
    return "€0";
  }
  return `€${Math.round(budget)}`;
};
