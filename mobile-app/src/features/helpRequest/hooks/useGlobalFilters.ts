import { create } from "zustand";

import { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { formatRequestLocation, getRequestCategoryLabel } from "@/features/helpRequest/utils/requestDisplay";
import { isUrgentRequestActive } from "@/features/helpRequest/utils/urgent";
import { calculateDistance } from "@/utils/distance";

export type RequestSortBy = "NEWEST" | "OLDEST" | "MOST_BIDS";
export type RequestRadiusFilter = "ANY" | "5" | "10" | "25" | "50" | "100";

export type GlobalFilters = {
  status: "ALL" | HelpRequestStatus;
  categoryId: "ALL" | string;
  urgentOnly: boolean;
  sortBy: RequestSortBy;
  radiusKm: RequestRadiusFilter;
  page: number;
};

const DEFAULT_FILTERS: GlobalFilters = {
  status: "ALL",
  categoryId: "ALL",
  urgentOnly: false,
  sortBy: "NEWEST",
  radiusKm: "ANY",
  page: 1,
};

type GlobalFiltersState = {
  filters: GlobalFilters;
  updateFilter: <K extends keyof Omit<GlobalFilters, "page">>(
    key: K,
    value: GlobalFilters[K]
  ) => void;
  resetFilters: () => void;
};

const useGlobalFiltersStore = create<GlobalFiltersState>((set) => ({
  filters: DEFAULT_FILTERS,
  updateFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        page: 1,
      },
    })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));

export const useGlobalFilters = () => {
  const filters = useGlobalFiltersStore((state) => state.filters);
  const updateFilter = useGlobalFiltersStore((state) => state.updateFilter);
  const resetFilters = useGlobalFiltersStore((state) => state.resetFilters);

  return { filters, updateFilter, resetFilters };
};

export const applyRequestSort = (
  requests: HelpRequest[],
  sortBy: RequestSortBy
) => {
  const next = [...requests];
  const urgentRank = (request: HelpRequest) =>
    isUrgentRequestActive(request) ? 1 : 0;

  if (sortBy === "NEWEST") {
    next.sort(
      (a, b) =>
        urgentRank(b) - urgentRank(a) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (sortBy === "OLDEST") {
    next.sort(
      (a, b) =>
        urgentRank(b) - urgentRank(a) ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  if (sortBy === "MOST_BIDS") {
    next.sort((a, b) => urgentRank(b) - urgentRank(a) || b.bidCount - a.bidCount);
  }

  return next;
};

type ApplyRequestFiltersOptions = {
  searchQuery?: string;
  latitude?: number | null;
  longitude?: number | null;
};

const normalizeSearch = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const requestMatchesSearch = (request: HelpRequest, searchQuery?: string) => {
  const query = normalizeSearch(searchQuery);
  if (!query) return true;

  const haystack = [
    request.title,
    request.description,
    request.requesterName,
    request.city,
    request.country,
    formatRequestLocation(request),
    getRequestCategoryLabel(request),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

const requestMatchesRadius = (
  request: HelpRequest,
  radiusKm: RequestRadiusFilter,
  coordinates?: Pick<ApplyRequestFiltersOptions, "latitude" | "longitude">
) => {
  if (radiusKm === "ANY") return true;

  const radius = Number(radiusKm);
  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;

  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    request.location?.latitude == null ||
    request.location?.longitude == null
  ) {
    return true;
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    request.location.latitude,
    request.location.longitude
  );

  return Number.isFinite(distance) ? distance <= radius : true;
};

export const applyRequestFilters = (
  requests: HelpRequest[],
  filters: GlobalFilters,
  options: ApplyRequestFiltersOptions = {}
) =>
  requests.filter((request) => {
    const statusMatches =
      filters.status === "ALL" || request.status === filters.status;
    const categoryMatches =
      filters.categoryId === "ALL" ||
      request.categoryId === filters.categoryId ||
      request.category?.id === filters.categoryId;
    const urgentMatches = !filters.urgentOnly || isUrgentRequestActive(request);

    return (
      statusMatches &&
      categoryMatches &&
      urgentMatches &&
      requestMatchesSearch(request, options.searchQuery) &&
      requestMatchesRadius(request, filters.radiusKm, options)
    );
  });

export const applyRequestFiltersAndSort = (
  requests: HelpRequest[],
  filters: GlobalFilters,
  options: ApplyRequestFiltersOptions = {}
) => applyRequestSort(applyRequestFilters(requests, filters, options), filters.sortBy);
