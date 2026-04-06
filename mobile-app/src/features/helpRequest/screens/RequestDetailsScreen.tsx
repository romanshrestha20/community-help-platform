import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { Card, Row, Screen, Stack, theme } from "@/design-system";
import { BidComposerCard } from "@/features/bid/components/BidComposerCard";
import { BidList } from "@/features/bid/components/BidList";
import { RequestDetailsHeader } from "@/features/helpRequest/components/RequestDetailHeader";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { useRequestDetails } from "@/features/helpRequest/hooks/useRequestDetails";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { showToast } from "@/utils/toast";

type Props = {
    requestId?: string;
};

export const RequestDetailsScreen = ({ requestId }: Props) => {
    const params = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const { palette } = useThemeContext();
    const [deleting, setDeleting] = useState(false);

    const activeRequestId = requestId || params.id;

    const {
        request,
        bids,
        loading,
        error,
        isOwner,
        myBid,
        fetchDetails,
        acceptBid,
        rejectBid,
        submitBid,
        deleteMyBid,
        setRequestStatus,
        deleteHelpRequest,
        actionLoadingByBidId,
    } = useRequestDetails(activeRequestId || "");

    const helperVisibleBids = useMemo(() => {
        if (isOwner) return bids;
        return myBid ? [myBid] : [];
    }, [bids, isOwner, myBid]);

    const handleDeleteRequest = () => {
        if (!request) return;

        Alert.alert("Delete request", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setDeleting(true);
                    try {
                        await deleteHelpRequest(request.id);
                        showToast("Request deleted");
                        router.back();
                    } finally {
                        setDeleting(false);
                    }
                },
            },
        ]);
    };

    if (!activeRequestId) {
        return (
            <Screen centered>
                <RequestEmptyState
                    title="Request not found"
                    description="Missing request identifier in route params."
                />
            </Screen>
        );
    }

    if (!request && loading) {
        return (
            <Screen centered>
                <RequestEmptyState
                    title="Loading request"
                    description="Fetching details and bids for this request."
                />
            </Screen>
        );
    }

    if (!request) {
        return (
            <Screen centered>
                <RequestEmptyState
                    title="Request unavailable"
                    description={error || "The request may have been removed."}
                    actionLabel="Retry"
                    onAction={fetchDetails}
                />
            </Screen>
        );
    }

    return (
        <Screen>
            <AppHeader title="Request Details" subtitle="Review status, bids, and next actions." />

            <RequestDetailsHeader request={request} />

            {isOwner ? (
                <Card>
                    <Stack gap="sm">
                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Owner actions</Text>
                        <Row gap="sm">
                            <AppButton
                                title="Edit Request"
                                onPress={() => router.push(`/home/requests/${request.id}/edit`)}
                                variant="secondary"
                                fullWidth={false}
                            />
                            <AppButton
                                title="Mark Assigned"
                                onPress={() => setRequestStatus("ASSIGNED")}
                                disabled={request.status !== "OPEN" || loading}
                                fullWidth={false}
                            />
                            <AppButton
                                title="Mark Completed"
                                onPress={() => setRequestStatus("COMPLETED")}
                                disabled={request.status !== "ASSIGNED" || loading}
                                variant="secondary"
                                fullWidth={false}
                            />
                        </Row>
                        <AppButton
                            title="Cancel Request"
                            onPress={() => setRequestStatus("CANCELLED")}
                            variant="secondary"
                            disabled={request.status === "COMPLETED" || request.status === "CANCELLED" || loading}
                        />
                        <AppButton
                            title="Delete Request"
                            onPress={handleDeleteRequest}
                            variant="danger"
                            loading={deleting}
                        />
                    </Stack>
                </Card>
            ) : null}

            <Card>
                <Stack gap="sm">
                    <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Bids</Text>
                    <BidList
                        bids={helperVisibleBids}
                        title={isOwner ? "All bids" : "My bid"}
                        listPadding="none"
                        emptyMessage={isOwner ? "No bids yet" : "You have not placed a bid yet."}
                        canRespond={isOwner}
                        canModify={!isOwner}
                        actionLoadingByBidId={actionLoadingByBidId}
                        onBidAccept={(bid) => acceptBid(bid.id)}
                        onBidReject={(bid) => rejectBid(bid.id)}
                        onBidDelete={(bid) => deleteMyBid(bid.id)}
                        onRetry={fetchDetails}
                    />
                </Stack>
            </Card>

            {!isOwner && request.status === "OPEN" && !myBid ? (
                <BidComposerCard
                    helpRequestId={request.id}
                    onSubmit={async (payload) => {
                        if (typeof payload.amount !== "number" || typeof payload.message !== "string") {
                            return;
                        }

                        await submitBid(payload.amount, payload.message);
                        showToast("Bid submitted");
                    }}
                    disabled={loading}
                />
            ) : null}
        </Screen>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
});

export default RequestDetailsScreen;
