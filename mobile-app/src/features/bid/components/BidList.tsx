import React from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Stack, Card, spacing, typography } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { BidCard } from "./BidCard";
import { Bid } from "../types/bid.types";

interface BidListProps {
    bids: Bid[];
    title?: string;
    listPadding?: "default" | "none";
    emptyMessage?: string;
    loading?: boolean;
    error?: string | null;
    onBidPress?: (bid: Bid) => void;
    onBidViewProfile?: (bid: Bid) => void;
    onBidAccept?: (bid: Bid) => void;
    onBidReject?: (bid: Bid) => void;
    onBidUpdate?: (bid: Bid) => void;
    onBidDelete?: (bid: Bid) => void;
    onBidMessage?: (bid: Bid) => void;
    canRespond?: boolean;
    canModify?: boolean;
    actionLoadingByBidId?: Record<string, boolean>;
    disableRespondActions?: boolean;
    onRetry?: () => void;
}

export const BidList: React.FC<BidListProps> = ({
    bids,
    title = "Bids",
    listPadding = "default",
    emptyMessage = "No bids yet",
    loading = false,
    error = null,
    onBidPress,
    onBidViewProfile,
    onBidAccept,
    onBidReject,
    onBidUpdate,
    onBidDelete,
    onBidMessage,
    canRespond = false,
    canModify = false,
    actionLoadingByBidId = {},
    disableRespondActions = false,
    onRetry,
}) => {
    const { palette } = useThemeContext();
    const containerStyle = listPadding === "none" ? styles.containerNoPadding : styles.container;

    const renderBid = ({ item }: { item: Bid }) => (
        <BidCard
            bid={item}
            onPress={() => onBidPress?.(item)}
            onViewProfile={() => onBidViewProfile?.(item)}
            onAccept={() => onBidAccept?.(item)}
            onReject={() => onBidReject?.(item)}
            onUpdate={() => onBidUpdate?.(item)}
            onDelete={() => onBidDelete?.(item)}
            onMessage={() => onBidMessage?.(item)}
            isRequestOwner={canRespond}
            canRespond={canRespond}
            canModify={canModify}
            loading={Boolean(actionLoadingByBidId[item.id])}
            disableRespondActions={disableRespondActions}
        />
    );

    if (loading && bids.length === 0) {
        return (
            <View style={containerStyle}>
                <View style={[styles.statePanel, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                    <Text style={[styles.bodyText, { color: palette.textSecondary }]}>Loading bids...</Text>
                </View>
            </View>
        );
    }

    if (error && bids.length === 0) {
        return (
            <View style={containerStyle}>
                <Card style={{ backgroundColor: palette.dangerSoft, borderColor: palette.danger }}>
                    <Stack gap="sm">
                        <Text style={[styles.bodyText, { color: palette.danger }]}>Error</Text>
                        <Text style={[styles.captionText, { color: palette.danger }]}>{error}</Text>
                        {onRetry && <AppButton title="Retry" onPress={onRetry} />}
                    </Stack>
                </Card>
            </View>
        );
    }

    if (bids.length === 0) {
        return (
            <View style={containerStyle}>
                <View style={[styles.statePanel, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                    <Text style={[styles.bodyText, { color: palette.textSecondary }]}>{emptyMessage}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={containerStyle}>
            <View style={[styles.titlePill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <Ionicons name="receipt-outline" size={14} color={palette.textSecondary} />
                <Text
                    style={[
                        styles.bodyText,
                        styles.titleText,
                        { color: palette.textSecondary, fontWeight: typography.fontWeight.semibold },
                    ]}
                >
                    {title} ({bids.length})
                </Text>
            </View>
            <FlatList
                data={bids}
                renderItem={renderBid}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    bodyText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.md,
        lineHeight: typography.lineHeight.md,
        fontWeight: typography.fontWeight.regular,
    },
    captionText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.sm,
        fontWeight: typography.fontWeight.regular,
    },
    titlePill: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
        marginBottom: spacing.md,
        columnGap: spacing.xs,
    },
    titleText: {
        fontSize: typography.fontSize.sm,
    },
    statePanel: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    container: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    containerNoPadding: {
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    listContent: {
        gap: spacing.sm,
    },
});
