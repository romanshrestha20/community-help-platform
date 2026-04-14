// hooks/useGlobalFilters.ts
import { useState } from "react";
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

export const useGlobalFilters = () => {
    const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);

    const updateFilter = <K extends keyof Omit<GlobalFilters, "page">>(
        key: K,
        value: GlobalFilters[K]
    ) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: 1,
        }));
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
    };

    return { filters, updateFilter, resetFilters };
};
