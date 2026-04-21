import React from "react";
import { FlatList, StyleSheet } from "react-native";

import { theme } from "@/design-system";

import { HelpRequest } from "../types/helpRequest.types";
import { RequestCard } from "./RequestCard";
import { RequestEmptyState } from "./RequestEmptyState";
import { AppLocation } from "@/features/location/types/location.types";

type Props = {
    requests: HelpRequest[];
    userLocation?: AppLocation | null;
    onPressItem?: (item: HelpRequest) => void;
    onBidItem?: (item: HelpRequest) => void;
    isBidActionDisabled?: (item: HelpRequest) => boolean;
    showFavoriteAction?: boolean;
    favoriteActionLabel?: string;
    bidActionLabel?: string;
    refreshing?: boolean;
    onRefresh?: () => void;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyActionLabel?: string;
    onPressEmptyAction?: () => void;
};

export const RequestList = ({
    requests,
    userLocation,
    onPressItem,
    onBidItem,
    isBidActionDisabled,
    showFavoriteAction = false,
    favoriteActionLabel,
    bidActionLabel,
    refreshing,
    onRefresh,
    emptyTitle = "No requests yet",
    emptyDescription = "Requests will appear here when they are created.",
    emptyActionLabel,
    onPressEmptyAction,
}: Props) => {
    return (
        <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <RequestCard
                    request={item}
                    userLocation={userLocation}
                    onPress={() => onPressItem?.(item)}
                    showBidAction={Boolean(onBidItem)}
                    bidActionLabel={bidActionLabel}
                    bidActionDisabled={isBidActionDisabled?.(item)}
                    onBidAction={() => onBidItem?.(item)}
                    showFavoriteAction={showFavoriteAction}
                    favoriteActionLabel={favoriteActionLabel}
                />
            )}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
                <RequestEmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onPressEmptyAction}
                />
            }
        />
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        gap: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
    },
});
