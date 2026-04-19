import { useCallback, useEffect, useState } from "react";

import { getCurrentCoordinates } from "@/features/location/services/location.service";
import { Coordinates } from "@/features/map/types/map.types";

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const current = await getCurrentCoordinates();
      setLocation(current);
      setPermissionDenied(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get current location.";

      setError(message);
      setPermissionDenied(message.toLowerCase().includes("permission"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  return {
    location,
    loading,
    permissionDenied,
    error,
    reload: loadLocation,
  };
};
