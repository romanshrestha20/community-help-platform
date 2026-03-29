import React from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import { Stack } from "@/design-system/layout/Stack";
import { Card } from "@/design-system/layout/Card";
import { AppButton } from "@/components/ui/AppButton";
import { BidCard } from "./BidCard";
import { spacing, colors, typography } from "@/design-system";
import { Bid } from "../types/bid.types";

interface BidListProps {
    bids: Bid[];
    title?: string;
    emptyMessage?: string;
    loading?: boolean;
    error?: string | null;
    onBidPress?: (bid: Bid) => void;
    onBidAccept?: (bid: Bid) => void;
    onBidReject?: (bid: Bid) => void;
    onBidUpdate?: (bid: Bid) => void;
    onBidDelete?: (bid: Bid) => void;
    canRespond?: boolean;
    canModify?: boolean;
    onRetry?: () => void;
}

export const BidList: React.FC<BidListProps> = ({
    bids,
    title = "Bids",
    emptyMessage = "No bids yet",
    loading = false,
    error = null,
    onBidPress,
    onBidAccept,
    onBidReject,
    onBidUpdate,
    onBidDelete,
    canRespond = false,
    canModify = false,
    onRetry,
}) => {
    const renderBid = ({ item }: { item: Bid }) => (
        <BidCard
            bid={item}
            onPress={() => onBidPress?.(item)}
            onAccept={() => onBidAccept?.(item)}
            onReject={() => onBidReject?.(item)}
            onUpdate={() => onBidUpdate?.(item)}
            onDelete={() => onBidDelete?.(item)}
            canRespond={canRespond}
            canModify={canModify}
            loading={loading}
        />
    );

    if (loading && bids.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.bodyText}>Loading bids...</Text>
            </View>
        );
    }

    if (error && bids.length === 0) {
        return (
            <View style={styles.container}>
                <Card style={{ backgroundColor: colors.dangerSoft }}>
                    <Stack gap="sm">
                        <Text style={[styles.bodyText, { color: colors.danger }]}>Error</Text>
                        <Text style={[styles.captionText, { color: colors.danger }]}>{error}</Text>
                        {onRetry && <AppButton title="Retry" onPress={onRetry} />}
                    </Stack>
                </Card>
            </View>
        );
    }

    if (bids.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{emptyMessage}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.bodyText, { fontWeight: typography.fontWeight.semibold, marginBottom: spacing.md }]}> 
                {title} ({bids.length})
            </Text>
            <FlatList
                data={bids}
                renderItem={renderBid}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
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
        color: colors.textPrimary,
    },
    captionText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.sm,
        fontWeight: typography.fontWeight.regular,
        color: colors.textPrimary,
    },
    container: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
});
