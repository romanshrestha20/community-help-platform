import React, { useMemo } from "react";
import { Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Row, ScreenView, Stack, theme } from "@/design-system";
import { BidComposerCard } from "@/features/bid/components/BidComposerCard";
import { BidEmptyState } from "@/features/bid/components/BidEmptyState";
import { BidList } from "@/features/bid/components/BidList";
import { useMyBidsScreen } from "@/features/bid/hooks/useMyBidsScreen";
import { showToast } from "@/utils/toast";

export const MyBidsScreen = () => {
    const router = useRouter();
    const {
        bids,
        loading,
        error,
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

    const handleDeleteBid = (bidId: string) => {
        Alert.alert("Delete bid", "This will permanently remove your bid.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const deleted = await removeBid(bidId);
                    if (deleted) {
                        showToast("Bid deleted");
                    }
                },
            },
        ]);
    };

    return (
        <ScreenView>
            <AppHeader
                title="My Bids"
                subtitle="Review, edit, and remove bids you submitted."
            />

            <Card>
                <Row gap="sm" style={styles.headerActions}>
                    <AppButton
                        title="Refresh"
                        onPress={refreshBids}
                        variant="secondary"
                        fullWidth={false}
                        disabled={loading || Boolean(savingBidId) || Boolean(deletingBidId)}
                    />
                </Row>
                {error ? <BidEmptyState title="Action unavailable" description={error} /> : null}
            </Card>

            <BidList
                bids={visibleBids}
                title="Submitted bids"
                listPadding="none"
                loading={loading}
                error={error}
                emptyMessage="You have not placed any bids yet."
                onRetry={refreshBids}
                canModify
                onBidPress={(bid) => router.push(`/home/requests/${bid.helpRequestId}`)}
                onBidUpdate={(bid) => openEditBid(bid)}
                onBidDelete={(bid) => handleDeleteBid(bid.id)}
                onBidViewProfile={undefined}
                actionLoadingByBidId={
                    savingBidId || deletingBidId ? { [savingBidId || deletingBidId || ""]: true } : {}
                }
            />

            {editingBid ? (
                <BidComposerCard
                    mode="edit"
                    initialData={editingBid}
                    title="Edit bid"
                    submitLabel="Save bid"
                    onSubmit={submitEditBid}
                    loading={Boolean(savingBidId)}
                    disabled={!editingBid}
                />
            ) : null}

            {editingBid ? (
                <Stack style={styles.editActions}>
                    <AppButton
                        title="Close editor"
                        onPress={closeEditBid}
                        variant="secondary"
                        fullWidth={false}
                        disabled={Boolean(savingBidId)}
                    />
                </Stack>
            ) : null}

            {!loading && !error && visibleBids.length === 0 ? (
                <BidEmptyState
                    title="No bids yet"
                    description="Browse requests and place your first bid from a request detail screen."
                />
            ) : null}
        </ScreenView>
    );
};

const styles = StyleSheet.create({
    headerActions: {
        justifyContent: "flex-end",
    },
    editActions: {
        marginTop: theme.spacing.sm,
    },
});

export default MyBidsScreen;
