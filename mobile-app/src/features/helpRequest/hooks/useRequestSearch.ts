import { useCallback } from "react";
import { create } from "zustand";

import {
  GlobalFilters,
  useGlobalFilters,
} from "@/features/helpRequest/hooks/useGlobalFilters";

type CoordinatesInput = {
  latitude?: number | null;
  longitude?: number | null;
};

type RequestSearchState = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  resetSearchQuery: () => void;
};

const useRequestSearchStore = create<RequestSearchState>((set) => ({
  searchQuery: "",
  setSearchQuery: (value) => set({ searchQuery: value }),
  resetSearchQuery: () => set({ searchQuery: "" }),
}));

export const buildRequestSearchParams = (
  filters: GlobalFilters,
  searchQuery: string,
  coordinates?: CoordinatesInput
) => {
  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;
  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return {
    search: searchQuery.trim() || undefined,
    categoryId: filters.categoryId !== "ALL" ? filters.categoryId : undefined,
    status: filters.status !== "ALL" ? filters.status : undefined,
    radiusKm:
      filters.radiusKm !== "ANY" && hasCoordinates
        ? Number(filters.radiusKm)
        : undefined,
    latitude: hasCoordinates ? latitude : undefined,
    longitude: hasCoordinates ? longitude : undefined,
  };
};

export const useRequestSearch = () => {
  const { filters, updateFilter, resetFilters } = useGlobalFilters();
  const searchQuery = useRequestSearchStore((state) => state.searchQuery);
  const setSearchQuery = useRequestSearchStore((state) => state.setSearchQuery);
  const resetSearchQuery = useRequestSearchStore((state) => state.resetSearchQuery);

  const buildParams = useCallback(
    (coordinates?: CoordinatesInput) =>
      buildRequestSearchParams(filters, searchQuery, coordinates),
    [filters, searchQuery]
  );

  const resetSearch = () => {
    resetSearchQuery();
    resetFilters();
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    searchQuery,
    setSearchQuery,
    resetSearchQuery,
    resetSearch,
    buildParams,
  };
};
