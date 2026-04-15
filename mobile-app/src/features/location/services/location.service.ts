import * as ExpoLocation from "expo-location";
import { AppLocation, LocationSuggestion } from "../types/location.types";


// This service provides functions to request location permissions, 
// get current coordinates, 
// and reverse geocode coordinates to a human-readable address.
export async function requestForegroundLocationPermission() {
    const existing = await ExpoLocation.getForegroundPermissionsAsync();

    if (existing.granted) {
        return existing;
    }

    // If permissions are not already granted, request them from the user.
    return ExpoLocation.requestForegroundPermissionsAsync();
}

// This function retrieves 
// the user's current geographic coordinates (latitude and longitude).
export async function getCurrentCoordinates() {
    const permission = await requestForegroundLocationPermission();


    if (!permission.granted) {
        throw new Error("Location permission denied");
    }

    const minimumAccuracyMeters = 100;
    const maxAttempts = 3;
    let bestResult: ExpoLocation.LocationObject | null = null;

    const lastKnownPosition = await ExpoLocation.getLastKnownPositionAsync();

    if (lastKnownPosition) {
        bestResult = lastKnownPosition;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const result = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Highest,
        });

        const reportedAccuracy = result.coords.accuracy;
        if (
            !bestResult ||
            (typeof reportedAccuracy === "number" &&
                (typeof bestResult.coords.accuracy !== "number" ||
                    reportedAccuracy < bestResult.coords.accuracy))
        ) {
            bestResult = result;
        }

        if (typeof reportedAccuracy !== "number" || reportedAccuracy <= minimumAccuracyMeters) {
            return {
                latitude: result.coords.latitude,
                longitude: result.coords.longitude,
            };
        }
    }

    if (bestResult) {
        return {
            latitude: bestResult.coords.latitude,
            longitude: bestResult.coords.longitude,
        };
    }

    throw new Error("Unable to determine current location");
}

// This function takes latitude and longitude as input 
// and returns a structured AppLocation object 
// containing the address details corresponding to those coordinates.
export async function reverseGeocodeToLocation(
    latitude: number,
    longitude: number
): Promise<AppLocation> {
    const results = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
    });

    const first = results[0];

    const addressLine1 = first
        ? [first.streetNumber, first.street]
            .filter(Boolean)
            .join(" ") || first.name || null
        : null;

    const formattedAddress = first
        ? [
            addressLine1,
            [first.postalCode, first.city].filter(Boolean).join(" "),
            first.region,
            first.country,
        ]
            .filter(Boolean)
            .join(", ")
        : null;

    const hasCoreAddress = Boolean(
        addressLine1 || first?.postalCode || first?.city || first?.region || first?.country
    );

    if (!hasCoreAddress) {
        const fallback = await reverseGeocodeWithNominatim(latitude, longitude);
        if (fallback) {
            return fallback;
        }
    }

    return {
        latitude,
        longitude,
        addressLine1,
        addressLine2: null,
        city: first?.city ?? null,
        state: first?.region ?? null,
        postalCode: first?.postalCode ?? null,
        country: first?.country ?? null,
        countryCode: first?.isoCountryCode?.toUpperCase() ?? null,
        formattedAddress,
    };
}

type NominatimReverseResponse = {
    display_name?: string;
    address?: {
        house_number?: string;
        road?: string;
        postcode?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        region?: string;
        county?: string;
        country?: string;
        country_code?: string;
    };
};

const reverseGeocodeWithNominatim = async (
    latitude: number,
    longitude: number
): Promise<AppLocation | null> => {
    try {
        const url = new URL("https://nominatim.openstreetmap.org/reverse");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("lat", String(latitude));
        url.searchParams.set("lon", String(longitude));
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("accept-language", "en");

        const response = await fetch(url.toString(), {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as NominatimReverseResponse;
        const address = payload.address;

        const addressLine1 = pickFirst(
            [address?.house_number, address?.road].filter(Boolean).join(" "),
            address?.road
        );

        return {
            latitude,
            longitude,
            addressLine1,
            addressLine2: null,
            city: pickFirst(address?.city, address?.town, address?.village, address?.municipality),
            state: pickFirst(address?.state, address?.region, address?.county),
            postalCode: pickFirst(address?.postcode),
            country: pickFirst(address?.country),
            countryCode: address?.country_code?.trim().toUpperCase() ?? null,
            formattedAddress: pickFirst(payload.display_name),
        };
    } catch {
        return null;
    }
};

const pickFirst = (...values: (string | null | undefined)[]) => {
    const value = values.find((item) => typeof item === "string" && item.trim().length > 0);
    return value ? value.trim() : null;
};

const formatSuggestionLabel = (addressLine1: string | null, postalCode: string | null, city: string | null) => {
    const locationSuffix = [postalCode, city].filter(Boolean).join(" ");
    if (addressLine1 && locationSuffix) {
        return `${addressLine1} — ${locationSuffix}`;
    }

    if (addressLine1) {
        return addressLine1;
    }

    return locationSuffix || "Address result";
};

const toLocationSuggestion = (result: any): LocationSuggestion => {
    const address = result?.address ?? {};
    const addressLine1 = pickFirst(address.house_number, address.road, address.pedestrian, address.footway, address.path, address.street);
    const postalCode = pickFirst(address.postcode);
    const city = pickFirst(address.city, address.town, address.village, address.municipality);
    const state = pickFirst(address.state, address.region, address.county);
    const country = pickFirst(address.country);
    const countryCode =
        typeof address.country_code === "string" && address.country_code.trim().length > 0
            ? address.country_code.trim().toUpperCase()
            : null;
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);
    const formattedAddress = typeof result?.display_name === "string" && result.display_name.trim().length > 0
        ? result.display_name.trim()
        : formatSuggestionLabel(addressLine1, postalCode, city);

    return {
        id: String(result?.place_id ?? `${latitude}:${longitude}:${formattedAddress}`),
        label: formatSuggestionLabel(addressLine1, postalCode, city),
        addressLine1,
        postalCode,
        city,
        state,
        country,
        countryCode,
        latitude,
        longitude,
        formattedAddress,
    };
};

export async function searchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
        return [];
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", trimmedQuery);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("accept-language", "en");

    const response = await fetch(url.toString(), {
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Failed to search location suggestions");
    }

    const payload = (await response.json()) as unknown;

    if (!Array.isArray(payload)) {
        return [];
    }

    return payload.map(toLocationSuggestion).filter(
        (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    );
}
