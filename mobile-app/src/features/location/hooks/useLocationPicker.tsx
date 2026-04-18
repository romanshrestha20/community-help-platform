import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppLocation, LocationSuggestion } from "../types/location.types";
import {
  getCurrentCoordinates,
  reverseGeocodeToLocation,
  searchLocationSuggestions,
} from "../services/location.service";

const LOCATION_STORAGE_KEY = "location_picker_value";

type UseLocationPickerOptions = {
  initialValue?: AppLocation | null;
  autoUseCurrentLocationOnMount?: boolean;
  storageKey?: string | null;
};

export function useLocationPicker(options?: UseLocationPickerOptions | null) {
  const {
    initialValue = null,
    autoUseCurrentLocationOnMount = true,
    storageKey = LOCATION_STORAGE_KEY,
  } = options ?? {};

  const [value, setValueState] = useState<AppLocation | null>(initialValue);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streetQuery, setStreetQueryState] = useState(
    initialValue?.formattedAddress || initialValue?.addressLine1 || ""
  );
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const skipNextSearchRef = useRef(false);
  const hasAutoInitializedRef = useRef(false);

  const persistLocation = useCallback(async (location: AppLocation | null) => {
    if (!storageKey) {
      return;
    }

    try {
      if (!location) {
        await AsyncStorage.removeItem(storageKey);
        return;
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(location));
    } catch {
      // ignore storage failure
    }
  }, [storageKey]);

  const applyLocation = useCallback(
    async (location: AppLocation | null, query?: string) => {
      setValueState(location);
      skipNextSearchRef.current = true;
      setStreetQueryState(
        query ?? location?.formattedAddress ?? location?.addressLine1 ?? ""
      );
      setSuggestions([]);
      setError(null);

      await persistLocation(location);
    },
    [persistLocation]
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateLocation = async () => {
      if (!storageKey) {
        if (initialValue) {
          setValueState(initialValue);
          skipNextSearchRef.current = true;
          setStreetQueryState(
            initialValue.formattedAddress || initialValue.addressLine1 || ""
          );
        }
        setHydrating(false);
        return;
      }

      try {
        const raw = await AsyncStorage.getItem(storageKey);

        if (!isMounted) return;

        if (raw) {
          const savedLocation = JSON.parse(raw) as AppLocation;

          setValueState(savedLocation);
          skipNextSearchRef.current = true;
          setStreetQueryState(
            savedLocation.formattedAddress || savedLocation.addressLine1 || ""
          );
        } else if (initialValue) {
          setValueState(initialValue);
          skipNextSearchRef.current = true;
          setStreetQueryState(
            initialValue.formattedAddress || initialValue.addressLine1 || ""
          );
        }
      } catch {
        if (!isMounted) return;

        if (initialValue) {
          setValueState(initialValue);
          skipNextSearchRef.current = true;
          setStreetQueryState(
            initialValue.formattedAddress || initialValue.addressLine1 || ""
          );
        }
      } finally {
        if (isMounted) {
          setHydrating(false);
        }
      }
    };

    void hydrateLocation();

    return () => {
      isMounted = false;
    };
  }, [initialValue, storageKey]);

  useEffect(() => {
    if (hydrating) return;
    if (hasAutoInitializedRef.current) return;

    hasAutoInitializedRef.current = true;

    const hasExistingLocation = Boolean(
      value?.formattedAddress ||
      value?.addressLine1 ||
      value?.city ||
      value?.country
    );
    const hasExistingQuery = streetQuery.trim().length > 0;

    if (autoUseCurrentLocationOnMount && !hasExistingLocation && !hasExistingQuery) {
      void (async () => {
        try {
          setLoading(true);
          setError(null);

          const coords = await getCurrentCoordinates();
          const location = await reverseGeocodeToLocation(
            coords.latitude,
            coords.longitude
          );

          await applyLocation(location);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to get location");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [applyLocation, autoUseCurrentLocationOnMount, hydrating, streetQuery, value]);

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

  const useCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const coords = await getCurrentCoordinates();
      const location = await reverseGeocodeToLocation(
        coords.latitude,
        coords.longitude
      );

      await applyLocation(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
    } finally {
      setLoading(false);
    }
  }, [applyLocation]);

  const setCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        setLoading(true);
        setError(null);

        const location = await reverseGeocodeToLocation(latitude, longitude);
        await applyLocation(location);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update location");
      } finally {
        setLoading(false);
      }
    },
    [applyLocation]
  );

  const selectSuggestion = useCallback(
    async (suggestion: LocationSuggestion) => {
      const location: AppLocation = {
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        addressLine1: suggestion.addressLine1,
        addressLine2: null,
        city: suggestion.city,
        state: suggestion.state,
        postalCode: suggestion.postalCode,
        country: suggestion.country,
        countryCode: suggestion.countryCode,
        formattedAddress: suggestion.formattedAddress,
      };

      await applyLocation(
        location,
        suggestion.addressLine1 || suggestion.formattedAddress || ""
      );
    },
    [applyLocation]
  );

  const clearLocation = useCallback(async () => {
    await applyLocation(null, "");
  }, [applyLocation]);

  const setStreetQuery = useCallback((nextQuery: string) => {
    setStreetQueryState((previousQuery) => {
      const previous = previousQuery.trim();
      const next = nextQuery.trim();

      // If user manually edits the query away from current selection, invalidate stale location.
      if (next !== previous && !skipNextSearchRef.current) {
        setValueState(null);
      }

      return nextQuery;
    });
  }, []);

  return {
    value,
    setValue: applyLocation,
    loading: loading || hydrating,
    error,
    streetQuery,
    setStreetQuery,
    suggestions,
    suggestionsLoading,
    useCurrentLocation,
    setCoordinates,
    selectSuggestion,
    clearLocation,
  };
}
