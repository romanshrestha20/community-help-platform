import React, { useMemo, useState, useCallback } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { Card, Screen, Stack, theme } from "@/design-system";
import { BidRequestModal } from "@/features/bid/components/BidRequestModal";
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
import { APP_ROUTES } from "@/config/routes";

type Props = {
    requestId?: string;
};

export const RequestDetailsScreen = ({ requestId }: Props) => {
    const params = useLocalSearchParams<{ id?: string }>();
    const pathname = usePathname();
    const router = useRouter();
    const { palette } = useThemeContext();
    const [deleting, setDeleting] = useState(false);
    const [bidModalVisible, setBidModalVisible] = useState(false);

    const activeRequestId = requestId || params.id;
    const isProfileRoute = pathname.startsWith(APP_ROUTES.PROFILE_REQUESTS);
    const requestListRoute = isProfileRoute
        ? APP_ROUTES.PROFILE_REQUESTS
        : APP_ROUTES.HOME_REQUESTS;
    const requestEditRoute = (id: string) =>
        isProfileRoute ? APP_ROUTES.PROFILE_REQUEST_EDIT(id) : APP_ROUTES.HOME_REQUEST_EDIT(id);

    const {
        request,
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
        return myBid ? [myBid] : [];
    }, [myBid]);

    const handleBack = useCallback(() => {
        goBackOrFallback({
            fallback: requestListRoute,
            replace: true,
        });
    }, [requestListRoute]);

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

    const handleOpenBidModal = useCallback(() => {
        if (!request) return;
        setBidModalVisible(true);
    }, [request]);

    const handleCloseBidModal = useCallback(() => {
        setBidModalVisible(false);
    }, []);

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
                    fallback: requestListRoute,
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
                    onEdit={() => router.push(requestEditRoute(request.id))}
                    onUpdateStatus={setRequestStatus}
                    onDelete={handleDeleteRequest}
                />
            ) : null}

            {actionError ? (
                <Card style={[styles.alertCard, { backgroundColor: palette.dangerSoft, borderColor: palette.danger }]}>
                    <Text style={[styles.errorText, { color: palette.danger }]}>
                        {actionError}
                    </Text>
                </Card>
            ) : null}

            {!isOwner && myBid ? (
                <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
                    <Stack gap="sm">
                        <View style={[styles.sectionPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                            <Ionicons name="document-text-outline" size={14} color={palette.textSecondary} />
                            <Text style={[styles.sectionPillText, { color: palette.textSecondary }]}>Bid overview</Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Your Bid</Text>

                        <BidList
                            bids={helperVisibleBids}
                            title="My bid"
                            listPadding="none"
                            emptyMessage=""
                            canRespond={false}
                            canModify
                            actionLoadingByBidId={actionLoadingByBidId}
                            onBidAccept={(bid) => acceptBid(bid.id)}
                            onBidReject={(bid) => rejectBid(bid.id)}
                            onBidDelete={(bid) => deleteMyBid(bid.id)}
                            onRetry={fetchDetails}
                        />
                    </Stack>
                </Card>
            ) : null}

            {!isOwner && isRequestOpenForBidding(request.status) && !myBid ? (
                <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
                    <Stack gap="sm">
                        <View style={[styles.sectionPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                            <Ionicons name="cash-outline" size={14} color={palette.textSecondary} />
                            <Text style={[styles.sectionPillText, { color: palette.textSecondary }]}>Take this request</Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Place Your Bid</Text>

                        <AppButton
                            title="Submit Offer"
                            onPress={handleOpenBidModal}
                            loading={loading}
                            disabled={loading}
                        />
                        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                            Send your offer amount and a short message.
                        </Text>
                    </Stack>
                </Card>
            ) : null}

            <BidRequestModal
                visible={bidModalVisible}
                selectedRequest={request}
                onClose={handleCloseBidModal}
                loading={loading}
                error={actionError}
                onSubmit={async (payload) => {
                    if (
                        typeof payload.amount !== "number" ||
                        typeof payload.message !== "string"
                    ) {
                        return;
                    }

                    await submitBid(payload.amount, payload.message);
                    setBidModalVisible(false);
                    showSuccessToast("Bid submitted successfully");
                }}
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        borderRadius: 16,
    },
    alertCard: {
        borderRadius: 14,
    },
    sectionPill: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        columnGap: 6,
    },
    sectionPillText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    helperText: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 20,
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
    },
});

export default RequestDetailsScreen;