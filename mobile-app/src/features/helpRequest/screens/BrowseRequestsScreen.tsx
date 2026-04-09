import React, { useMemo, useState } from "react";

import { AppHeader } from "@/components/ui/AppHeader";
import { AppInput } from "@/components/ui/AppInput";
import { Card, ScreenView, Stack, theme } from "@/design-system";
import { RequestFilters } from "@/features/helpRequest/components/RequestFilters";
import { RequestList } from "@/features/helpRequest/components/RequestList";
import { useGlobalFilters } from "@/features/helpRequest/hooks/useGlobalFilters";
import { useRequestList } from "@/features/helpRequest/hooks/useRequestList";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@/config/routes";
import { StyleSheet } from "react-native";
import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";

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
    const [searchQuery, setSearchQuery] = useState("");
    const { value: userLocation } = useLocationPicker({ autoUseCurrentLocationOnMount: true });

    const filteredRequests = useMemo(() => {
        const base = applyFilters(requests, filters);
        const query = searchQuery.trim().toLowerCase();

        if (!query) return base;

        return base.filter((request) => {
            const haystack = [
                request.title,
                request.description,
                request.category,
                request.requesterName,
                request.city ?? "",
                request.country ?? "",
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [filters, requests, searchQuery]);

    const handleResetAll = () => {
        setSearchQuery("");
        resetFilters();
    };

    return (
        <ScreenView>
            <AppHeader
                title="Browse Requests"
                subtitle="Find nearby requests from other community members."
                showBackButton
                backButtonProps={{
                    fallback: APP_ROUTES.HOME,
                    variant: "secondary",
                }}
            />

            <Card style={styles.filtersCard}>
                <AppInput
                    label="Search requests"
                    placeholder="Search by title, category, or location"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    returnKeyType="search"
                />

                <RequestFilters
                    filters={filters}
                    updateFilter={updateFilter}
                    resetFilters={resetFilters}
                />
            </Card>

            <Stack style={styles.listContainer}>
                <RequestList
                    requests={filteredRequests}
                    userLocation={userLocation}
                    onPressItem={(item) => router.push(APP_ROUTES.HOME_REQUEST_DETAILS(item.id))}
                    refreshing={refreshing}
                    onRefresh={refreshRequests}
                    emptyTitle={searchQuery ? "No requests match your search" : "No requests match your filters"}
                    emptyDescription={
                        searchQuery
                            ? "Try a different search keyword or reset filters."
                            : "Try widening your radius or resetting filters."
                    }
                    emptyActionLabel="Reset"
                    onPressEmptyAction={handleResetAll}
                />
            </Stack>
        </ScreenView>
    );
};

export default BrowseRequestsScreen;

const styles = StyleSheet.create({
    filtersCard: {
        marginBottom: theme.spacing.xs,
    },
    listContainer: {
        flex: 1,
    },
});

