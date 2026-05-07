import React, { useMemo } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Row, Screen, Stack, theme } from "@/design-system";
import { BidComposerCard } from "@/features/bid/components/BidComposerCard";
import { BidEmptyState } from "@/features/bid/components/BidEmptyState";
import { BidList } from "@/features/bid/components/BidList";
import { useMyBidsScreen } from "@/features/bid/hooks/useMyBidsScreen";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { showSuccessToast } from "@/utils/toast";
import { APP_ROUTES } from "@/config/routes";


export const MyBidsScreen = () => {
    const router = useRouter();
    const { palette } = useThemeContext();
    const {
        bids,
        loading,
        error,
        refreshing,
        savingBidId,
        deletingBidId,
        editingBid,
        refreshBids,
        openEditBid,
        closeEditBid,
        submitEditBid,
        removeBid,
    } = useMyBidsScreen();

    const visibleBids = useMemo(() => bids, [bids]);
    const pendingCount = useMemo(
        () => visibleBids.filter((bid) => bid.status === "PENDING").length,
        [visibleBids]
    );
    const acceptedCount = useMemo(
        () => visibleBids.filter((bid) => bid.status === "ACCEPTED").length,
        [visibleBids]
    );
    const rejectedCount = useMemo(
        () => visibleBids.filter((bid) => bid.status === "REJECTED").length,
        [visibleBids]
    );

    const handleDeleteBid = (bidId: string) => {
        Alert.alert("Delete bid", "This will permanently remove your bid.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const deleted = await removeBid(bidId);
                    if (deleted) {
                        showSuccessToast("Bid deleted successfully");
                    }
                },
            },
        ]);
    };

    return (
        <Screen
            style={styles.screen}
            showsVerticalScrollIndicator={false}
            refreshControl={(
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refreshBids}
                    tintColor={palette.primary}
                />
            )}
        >
            <View style={styles.headerWrap}>
                <AppHeader
                    title="My Bids"
                    subtitle="Review, edit, and remove bids you submitted."
                    variant="large"
                    divider
                    showBackButton
                    backButtonProps={{
                        fallback: APP_ROUTES.HOME,
                        variant: "secondary",
                    }}
                />

                <Card style={styles.summaryCard}>
                    <Stack gap="sm">
                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Overview</Text>

                        <Row gap="sm" style={styles.summaryRow}>
                            <View
                                style={[
                                    styles.metricTile,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                                    {visibleBids.length}
                                </Text>
                                <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                                    Total
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.metricTile,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                                    {pendingCount}
                                </Text>
                                <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                                    Pending
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.metricTile,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                                    {acceptedCount}
                                </Text>
                                <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                                    Accepted
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.metricTile,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                                    {rejectedCount}
                                </Text>
                                <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                                    Rejected
                                </Text>
                            </View>
                        </Row>
                    </Stack>
                </Card>

                <Text style={[styles.listTitle, { color: palette.textPrimary }]}>
                    Submitted bids ({visibleBids.length})
                </Text>
            </View>

            {loading || visibleBids.length > 0 ? (
                <BidList
                    bids={visibleBids}
                    title=""
                    listPadding="none"
                    loading={loading}
                    error={error}
                    emptyMessage=""
                    onRetry={refreshBids}
                    canModify
                    onBidPress={(bid) => router.push(`/home/requests/${bid.helpRequestId}`)}
                    onBidUpdate={(bid) => openEditBid(bid)}
                    onBidDelete={(bid) => handleDeleteBid(bid.id)}
                    onBidMessage={(bid) => router.push(`/messages/chat?requestId=${bid.helpRequestId}` as never)}
                    onBidViewProfile={undefined}
                    actionLoadingByBidId={
                        savingBidId || deletingBidId ? { [savingBidId || deletingBidId || ""]: true } : {}
                    }
                />
            ) : null}

            {!loading && visibleBids.length === 0 ? (
                <View>
                    {error ? (
                        <BidEmptyState
                            title="Action unavailable"
                            description={error}
                            actionLabel="Retry"
                            onAction={refreshBids}
                        />
                    ) : (
                        <BidEmptyState
                            title="No bids yet"
                            description="Browse requests and place your first bid from a request detail screen."
                        />
                    )}
                </View>
            ) : null}

            {editingBid ? (
                <Card style={styles.editorCard}>
                    <Stack gap="sm">
                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                            Edit bid
                        </Text>
                        <BidComposerCard
                            mode="edit"
                            initialData={editingBid}
                            title="Edit bid"
                            submitLabel="Save bid"
                            onSubmit={submitEditBid}
                            loading={Boolean(savingBidId)}
                            disabled={!editingBid}
                        />
                        <AppButton
                            title="Close editor"
                            onPress={closeEditBid}
                            variant="secondary"
                            fullWidth={false}
                            disabled={Boolean(savingBidId)}
                        />
                    </Stack>
                </Card>
            ) : null}

            <Text style={[styles.caption, { color: palette.textSecondary }]}>
                Use refresh to load your latest bid activity.
            </Text>
        </Screen>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    headerWrap: {
        marginBottom: theme.spacing.xs,
    },
    summaryCard: {
        marginBottom: theme.spacing.sm,
    },
    summaryRow: {
        flexWrap: "nowrap",
    },
    metricTile: {
        flex: 1,
        minWidth: 0,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
    },
    metricValue: {
        fontSize: theme.typography.fontSize.lg,
        lineHeight: theme.typography.lineHeight.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    metricLabel: {
        marginTop: theme.spacing.xxs,
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    listTitle: {
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    editorCard: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    caption: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
        lineHeight: theme.typography.lineHeight.xs,
    },
});

export default MyBidsScreen;
