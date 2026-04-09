/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Format distance for display
 * Shows km if > 1, otherwise shows meters
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Get distance between user location and request location
 */
export const getDistanceToRequest = (
  userLatitude: number,
  userLongitude: number,
  requestLatitude: number,
  requestLongitude: number
): string => {
  const distanceKm = calculateDistance(
    userLatitude,
    userLongitude,
    requestLatitude,
    requestLongitude
  );
  return formatDistance(distanceKm);
};
