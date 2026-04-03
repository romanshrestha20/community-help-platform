import { AppLocation } from "../types/location.types";

const EARTH_RADIUS_KM = 6371;

export const haversineDistanceKm = (from: AppLocation, to: AppLocation): number => {
    const toRadians = (value: number) => (value * Math.PI) / 180;

    const deltaLat = toRadians(to.latitude - from.latitude);
    const deltaLon = toRadians(to.longitude - from.longitude);
    const startLat = toRadians(from.latitude);
    const endLat = toRadians(to.latitude);

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLon / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

export const getReadableLocationLabel = (location: AppLocation | null | undefined) => {
    if (!location) {
        return null;
    }

    return (
        location.formattedAddress ||
        [location.addressLine1, [location.postalCode, location.city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(", ") ||
        [location.state, location.country].filter(Boolean).join(", ") ||
        null
    );
};