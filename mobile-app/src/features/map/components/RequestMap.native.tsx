import React, { RefObject, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
  onSelectRequest: (request: MapRequestItem) => void;
  onPressMap?: () => void;
  showsMyLocationButton?: boolean;
  mapRef?: RefObject<MapView | null>;
  onRegionChangeComplete?: (region: Region, isGesture?: boolean) => void;
};

const hasValidCoordinate = (
  latitude?: number | null,
  longitude?: number | null
) =>
  typeof latitude === "number" &&
  typeof longitude === "number" &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

export const RequestMap: React.FC<Props> = ({
  userLocation,
  requests,
  onSelectRequest,
  onPressMap,
  showsMyLocationButton = true,
  mapRef,
  onRegionChangeComplete,
}) => {
  const internalMapRef = useRef<MapView | null>(null);
  const resolvedMapRef = mapRef ?? internalMapRef;
  const hasAutoCenteredRef = useRef(false);

  const validRequests = useMemo(
    () =>
      requests.filter((request) =>
        hasValidCoordinate(
          request.location?.latitude,
          request.location?.longitude
        )
      ),
    [requests]
  );

  const initialRegion = useMemo(
    () => getRegionForCoordinates(userLocation, validRequests),
    [userLocation, validRequests]
  );

  useEffect(() => {
    if (!resolvedMapRef.current || hasAutoCenteredRef.current) return;

    const region = getRegionForCoordinates(userLocation, validRequests);
    resolvedMapRef.current.animateToRegion(region, 350);
    hasAutoCenteredRef.current = true;
  }, [resolvedMapRef, userLocation, validRequests]);

  return (
    <View style={styles.container}>
      <MapView
        ref={resolvedMapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={showsMyLocationButton}
        onPress={onPressMap}
        onRegionChangeComplete={(region, details) => {
          onRegionChangeComplete?.(region, details?.isGesture);
        }}
      >
        {validRequests.map((request) => {
          const isUrgentActive =
            request.status === "OPEN" && isUrgentRequestActive(request);
          return (
          <Marker
            key={request.id}
            coordinate={{
              latitude: request.location!.latitude!,
              longitude: request.location!.longitude!,
            }}
            title={request.title}
            description={request.location?.formattedAddress ?? ""}
            pinColor={isUrgentActive ? "#DC2626" : undefined}
            onPress={() => onSelectRequest(request)}
          />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
