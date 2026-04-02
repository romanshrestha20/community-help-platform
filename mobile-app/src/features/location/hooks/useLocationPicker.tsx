import { useCallback, useEffect, useRef, useState } from "react";
import { AppLocation, LocationSuggestion } from "../types/location.types";
import {
    getCurrentCoordinates,
    searchLocationSuggestions,
    reverseGeocodeToLocation,
} from "../services/location.service";

export function useLocationPicker(initialValue?: AppLocation | null) {
    const [value, setValue] = useState<AppLocation | null>(initialValue ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streetQuery, setStreetQuery] = useState(
        initialValue?.formattedAddress || initialValue?.addressLine1 || ""
    );
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const skipNextSearchRef = useRef(false);

    useEffect(() => {
        const query = streetQuery.trim();

        if (skipNextSearchRef.current) {
            skipNextSearchRef.current = false;
            return;
        }

        if (query.length < 2) {
            setSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }

        let isActive = true;
        setSuggestionsLoading(true);

        const timeoutId = setTimeout(async () => {
            try {
                const results = await searchLocationSuggestions(query);

                if (isActive) {
                    setSuggestions(results);
                }
            } catch {
                if (isActive) {
                    setSuggestions([]);
                }
            } finally {
                if (isActive) {
                    setSuggestionsLoading(false);
                }
            }
        }, 350);

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, [streetQuery]);

    // This function retrieves the user's current location 
    // and updates the state with the corresponding address details.
    const useCurrentLocation = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get the current geographic coordinates (latitude and longitude).
            const coords = await getCurrentCoordinates();
            const location = await reverseGeocodeToLocation(
                coords.latitude,
                coords.longitude
            );

            setValue(location);
            skipNextSearchRef.current = true;
            setStreetQuery(location.formattedAddress || location.addressLine1 || "");
            setSuggestions([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get location");
        } finally {
            setLoading(false);
        }
    }, []);

    // This function allows manually setting the location 
    // by providing latitude and longitude,
    // which are then reverse geocoded 
    // to update the state with the corresponding address details.
    const setCoordinates = useCallback(async (latitude: number, longitude: number) => {
        try {
            setLoading(true);
            setError(null);

            // Reverse geocode the provided coordinates 
            // to get the location details.
            const location = await reverseGeocodeToLocation(latitude, longitude);
            setValue(location);
            skipNextSearchRef.current = true;
            setStreetQuery(location.formattedAddress || location.addressLine1 || "");
            setSuggestions([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update location");
        } finally {
            setLoading(false);
        }
    }, []);

    const selectSuggestion = useCallback((suggestion: LocationSuggestion) => {
        const location: AppLocation = {
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            addressLine1: suggestion.addressLine1,
            addressLine2: null,
            city: suggestion.city,
            state: suggestion.state,
            postalCode: suggestion.postalCode,
            country: suggestion.country,
            formattedAddress: suggestion.formattedAddress,
        };

        skipNextSearchRef.current = true;
        setValue(location);
        setError(null);
        setStreetQuery(suggestion.label || suggestion.formattedAddress || "");
        setSuggestions([]);
    }, []);

    return {
        value,
        setValue,
        loading,
        error,
        streetQuery,
        setStreetQuery,
        suggestions,
        suggestionsLoading,
        useCurrentLocation,
        setCoordinates,
        selectSuggestion,
    };
}