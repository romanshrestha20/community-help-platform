// hooks/useRequestFilters.ts
import { useMemo, useState } from "react";
import { HelpRequest, HelpRequestStatus } from "@/features/helpRequest/components";

export const useRequestFilters = (requests: HelpRequest[]) => {
    const [statusFilter, setStatusFilter] = useState<"ALL" | HelpRequestStatus>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<"ALL" | HelpRequest["category"]>("ALL");
    const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "MOST_BIDS">("NEWEST");
    const [radiusFilter, setRadiusFilter] = useState<"ANY" | "5" | "10" | "25" | "50" | "100">("ANY");

    const filteredRequests = useMemo(() => {
        let next = [...requests];

        if (statusFilter !== "ALL") next = next.filter((r) => r.status === statusFilter);
        if (categoryFilter !== "ALL") next = next.filter((r) => r.category === categoryFilter);

        if (sortBy === "NEWEST") next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (sortBy === "OLDEST") next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (sortBy === "MOST_BIDS") next.sort((a, b) => b.bidCount - a.bidCount);

        return next;
    }, [requests, statusFilter, categoryFilter, sortBy]);

    return {
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        sortBy,
        setSortBy,
        radiusFilter,
        setRadiusFilter,
        filteredRequests,
    };
};