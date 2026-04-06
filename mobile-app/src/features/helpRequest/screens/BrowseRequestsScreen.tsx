import React, { useMemo } from "react";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card, ScreenView, Stack } from "@/design-system";
import { RequestFilters } from "@/features/helpRequest/components/RequestFilters";
import { RequestList } from "@/features/helpRequest/components/RequestList";
import { useGlobalFilters } from "@/features/helpRequest/hooks/useGlobalFilters";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { useRouter } from "expo-router";

const applyFilters = (requests: HelpRequest[], filters: ReturnType<typeof useGlobalFilters>["filters"]) => {
    let next = [...requests];

    if (filters.status !== "ALL") {
        next = next.filter((request) => request.status === filters.status);
    }

    if (filters.category !== "ALL") {
        next = next.filter((request) => request.category === filters.category);
    }

    if (filters.sortBy === "NEWEST") {
        next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (filters.sortBy === "OLDEST") {
        next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    if (filters.sortBy === "MOST_BIDS") {
        next.sort((a, b) => b.bidCount - a.bidCount);
    }

    return next;
};

export const BrowseRequestsScreen = () => {
    const router = useRouter();
    const { filters, updateFilter, resetFilters } = useGlobalFilters();
    const { requests, refreshing, refreshRequests } = useRequestList({ scope: "browse" });

    const filteredRequests = useMemo(() => applyFilters(requests, filters), [filters, requests]);

    return (
        <ScreenView>
            <AppHeader
                title="Browse Requests"
                subtitle="Find nearby requests from other community members."
            />

            <Card>
                <RequestFilters
                    filters={filters}
                    updateFilter={updateFilter}
                    resetFilters={resetFilters}
                />
            </Card>

            <Stack style={{ flex: 1 }}>
                <RequestList
                    requests={filteredRequests}
                    onPressItem={(item) => router.push(`/home/requests/${item.id}`)}
                    refreshing={refreshing}
                    onRefresh={refreshRequests}
                    emptyTitle="No requests match your filters"
                    emptyDescription="Try widening your radius or resetting filters."
                    emptyActionLabel="Reset filters"
                    onPressEmptyAction={resetFilters}
                />
            </Stack>
        </ScreenView>
    );
};

export default BrowseRequestsScreen;
