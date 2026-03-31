// hooks/useGlobalFilters.ts
import { useState } from "react";
import { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";

export type RequestSortBy = "NEWEST" | "OLDEST" | "MOST_BIDS";

export type GlobalFilters = {
    status: "ALL" | HelpRequestStatus;
    category: "ALL" | HelpRequest["category"];
    sortBy: RequestSortBy;
    page: number;
};

const DEFAULT_FILTERS: GlobalFilters = {
    status: "ALL",
    category: "ALL",
    sortBy: "NEWEST",
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