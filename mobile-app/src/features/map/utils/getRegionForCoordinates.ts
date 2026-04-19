import { Region } from "react-native-maps";

import { Coordinates, MapRequestItem } from "@/features/map/types/map.types";

const DEFAULT_REGION: Region = {
  latitude: 60.1699, // Helsinki fallback
  longitude: 24.9384,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const isValidCoordinate = (
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

/**
 * Returns a safe map region based on:
 * 1. user location (highest priority)
 * 2. first valid request
 * 3. default fallback (Helsinki)
 */
export const getRegionForCoordinates = (
  userLocation?: Coordinates | null,
  requests: MapRequestItem[] = []
): Region => {
  // 1. Use user location if available
  if (isValidCoordinate(userLocation?.latitude, userLocation?.longitude)) {
    return {
      latitude: userLocation!.latitude,
      longitude: userLocation!.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  // 2. Fallback to first valid request
  const firstRequest = requests.find((request) =>
    isValidCoordinate(
      request.location?.latitude,
      request.location?.longitude
    )
  );

  if (firstRequest?.location) {
    return {
      latitude: firstRequest.location.latitude!,
      longitude: firstRequest.location.longitude!,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  // 3. Default fallback
  return DEFAULT_REGION;
};