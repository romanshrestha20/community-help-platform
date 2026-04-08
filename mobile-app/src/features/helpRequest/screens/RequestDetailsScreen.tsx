import React, { useMemo, useState, useCallback } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Screen, Stack, theme } from "@/design-system";
import { BidComposerCard } from "@/features/bid/components/BidComposerCard";
import { BidList } from "@/features/bid/components/BidList";
import { RequestPhotoUploadSection } from "@/features/helpRequest/components/RequestPhotoUploadSection";
import { RequestActionBar } from "@/features/helpRequest/components/RequestActionBar";
import { RequestDetailsHeader } from "@/features/helpRequest/components/RequestDetailHeader";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { useRequestDetails } from "@/features/helpRequest/hooks/useRequestDetails";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { showSuccessToast } from "@/utils/toast";
import { isRequestOpenForBidding } from "@/features/helpRequest/utils/requestValidation";
import { goBackOrFallback } from "@/utils/navigation";

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
        removeRequest,
        actionError,
        actionLoadingByBidId,
    } = useRequestDetails(activeRequestId || "");

    const helperVisibleBids = useMemo(() => {
        if (isOwner) return bids;
        return myBid ? [myBid] : [];
    }, [bids, isOwner, myBid]);

    const handleBack = useCallback(() => {
        goBackOrFallback({
            fallback: "/home/requests",
            replace: true,
        });
    }, []);

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
                        const deleted = await removeRequest();
                        if (!deleted) return;

                        showSuccessToast("Request deleted successfully");
                        handleBack();
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


            <AppHeader
                title="Request Details"
                subtitle="Review status, bids, and next actions."
                showBackButton
                backButtonProps={{
                    fallback: "/home/requests",
                    variant: "secondary",
                }}
            />

            <RequestDetailsHeader request={request} />

            {request.images?.length ? (
                <RequestPhotoUploadSection
                    title="Uploaded photos"
                    description="Photos attached to this request."
                    existingImages={request.images}
                    selectedImages={[]}
                    readOnly
                />
            ) : null}

            {isOwner ? (
                <RequestActionBar
                    request={request}
                    loading={loading}
                    deleting={deleting}
                    onEdit={() => router.push(`/home/requests/${request.id}/edit`)}
                    onUpdateStatus={setRequestStatus}
                    onDelete={handleDeleteRequest}
                />
            ) : null}

            {actionError ? (
                <Card>
                    <Text style={[styles.errorText, { color: palette.danger }]}>
                        {actionError}
                    </Text>
                </Card>
            ) : null}

            <Card>
                <Stack gap="sm">
                    <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                        Bids
                    </Text>

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

            {!isOwner && isRequestOpenForBidding(request.status) && !myBid ? (
                <BidComposerCard
                    helpRequestId={request.id}
                    onSubmit={async (payload) => {
                        if (
                            typeof payload.amount !== "number" ||
                            typeof payload.message !== "string"
                        ) {
                            return;
                        }

                        await submitBid(payload.amount, payload.message);
                        showSuccessToast("Bid submitted successfully");
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
    errorText: {
        fontSize: theme.typography.fontSize.sm,
    },
});

export default RequestDetailsScreen;