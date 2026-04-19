import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { getNearbyRequests } from "@/features/map/services/map.service";
import { MapRequestFilters, MapRequestItem } from "@/features/map/types/map.types";

type UseRequestMapOptions = {
  autoFetch?: boolean;
};

const getRequesterId = (request: MapRequestItem) =>
  request.requesterId ??
  null;

export const useRequestMap = (
  filters: MapRequestFilters,
  options: UseRequestMapOptions = {}
) => {
  const { autoFetch = true } = options;
  const [requests, setRequests] = useState<MapRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id || user?.profile?.userId || null;

  const stableFilters = useMemo(
    () => ({
      latitude: filters.latitude,
      longitude: filters.longitude,
      radiusKm: filters.radiusKm,
      categoryId: filters.categoryId,
      status: filters.status,
      search: filters.search,
      bounds: filters.bounds,
    }),
    [
      filters.latitude,
      filters.longitude,
      filters.radiusKm,
      filters.categoryId,
      filters.status,
      filters.search,
      filters.bounds,
    ]
  );

  const loadRequests = useCallback(async () => {
    const hasCoordinateCenter =
      stableFilters.latitude != null && stableFilters.longitude != null;
    const hasBounds =
      stableFilters.bounds != null;

    if (!hasCoordinateCenter && !hasBounds) {
      setRequests([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const next = await getNearbyRequests(stableFilters);

      setRequests(
        next.filter((request) => {
          if (!currentUserId) return true;
          return getRequesterId(request) !== currentUserId;
        })
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load map requests."
      );
    } finally {
      setLoading(false);
    }
  }, [currentUserId, stableFilters]);

  useEffect(() => {
    if (!autoFetch) return;
    void loadRequests();
  }, [autoFetch, loadRequests]);

  return {
    requests,
    loading,
    error,
    reload: loadRequests,
    setRequests,
  };
};
