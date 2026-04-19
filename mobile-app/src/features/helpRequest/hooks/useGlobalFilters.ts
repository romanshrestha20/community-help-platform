import { create } from "zustand";

import { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";

export type RequestSortBy = "NEWEST" | "OLDEST" | "MOST_BIDS";
export type RequestRadiusFilter = "ANY" | "5" | "10" | "25" | "50" | "100";

export type GlobalFilters = {
  status: "ALL" | HelpRequestStatus;
  categoryId: "ALL" | string;
  sortBy: RequestSortBy;
  radiusKm: RequestRadiusFilter;
  page: number;
};

const DEFAULT_FILTERS: GlobalFilters = {
  status: "ALL",
  categoryId: "ALL",
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

  if (sortBy === "NEWEST") {
    next.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (sortBy === "OLDEST") {
    next.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  if (sortBy === "MOST_BIDS") {
    next.sort((a, b) => b.bidCount - a.bidCount);
  }

  return next;
};
