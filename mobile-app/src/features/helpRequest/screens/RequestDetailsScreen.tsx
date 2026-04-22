import React, { useMemo, useState, useCallback } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { AppHeader } from "@/components/ui/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { Card, Row, Screen, Stack, theme } from "@/design-system";
import { BidRequestModal } from "@/features/bid/components/BidRequestModal";
import { BidList } from "@/features/bid/components/BidList";
import { EditBidModal } from "@/features/bid/components/EditBidModal";
import { RequestPhotoUploadSection } from "@/features/helpRequest/components/RequestPhotoUploadSection";
import { RequestActionBar } from "@/features/helpRequest/components/RequestActionBar";
import { RequestDetailsHeader } from "@/features/helpRequest/components/RequestDetailHeader";
import { RequestDetailsSkeleton } from "@/features/helpRequest/components/RequestDetailsSkeleton";
import { RequestEmptyState } from "@/features/helpRequest/components/RequestEmptyState";
import { useRequestDetails } from "@/features/helpRequest/hooks/useRequestDetails";
import type { HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { useFavorites } from "@/features/favorites/hooks/favorite.hook";
import {
    ReviewCard,
    ReviewComposerModal,
} from "@/features/reviews/components";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { showSuccessToast } from "@/utils/toast";
import { isRequestOpenForBidding } from "@/features/helpRequest/utils/requestValidation";
import { goBackOrFallback } from "@/utils/navigation";
import { APP_ROUTES } from "@/config/routes";
import type { Bid } from "@/features/bid/types/bid.types";

type Props = {
    requestId?: string;
};

export const RequestDetailsScreen = ({ requestId }: Props) => {
    const params = useLocalSearchParams<{ id?: string }>();
    const pathname = usePathname();
    const router = useRouter();
    const { palette } = useThemeContext();
    const authUser = useAuthStore((state) => state.user);
    const [deleting, setDeleting] = useState(false);
    const [bidModalVisible, setBidModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [editingBid, setEditingBid] = useState<Bid | null>(null);
    const [savingBid, setSavingBid] = useState(false);

    const activeRequestId = requestId || params.id;
    const isProfileRoute = pathname.startsWith(APP_ROUTES.PROFILE_REQUESTS);
    const isFavoritesRoute = pathname.startsWith(APP_ROUTES.FAVORITES);

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
        updateMyBid,
        deleteMyBid,
        setRequestStatus,
        removeRequest,
        actionError,
        actionLoadingByBidId,
    } = useRequestDetails(activeRequestId || "");
    const { isFavorite, toggleFavorite, actionLoadingById } = useFavorites();
    const {
        createReview,
        updateReview,
        getCachedReviews,
        getUserReviews,
        loading: reviewActionLoading,
        loadingByUserId,
        error: reviewError,
    } = useReviews();

    const requestListRoute = isProfileRoute
        ? APP_ROUTES.PROFILE_REQUESTS
        : isFavoritesRoute
            ? APP_ROUTES.FAVORITES
            : APP_ROUTES.HOME_REQUESTS;
    const requestEditRoute = (id: string) =>
        isOwner ? APP_ROUTES.PROFILE_REQUEST_EDIT(id) : APP_ROUTES.HOME_REQUEST_EDIT(id);

    const favoriteLoading = activeRequestId ? Boolean(actionLoadingById[activeRequestId]) : false;
    const favorited = activeRequestId ? isFavorite(activeRequestId) : false;
    const currentUserId = authUser?.id;
    const requestIdValue = request?.id ?? "";
    const helperId = request?.assignedHelperId ?? null;
    const helperReviews = useMemo(
        () => (helperId ? getCachedReviews(helperId) : []),
        [getCachedReviews, helperId]
    );
    const existingReview = useMemo(() => {
        if (!currentUserId) {
            return null;
        }

        return (
            helperReviews.find(
                (review) =>
                    review.helpRequest.id === requestIdValue &&
                    review.reviewer.id === currentUserId
            ) ?? null
        );
    }, [currentUserId, helperReviews, requestIdValue]);
    const reviewLoading =
        reviewActionLoading || (helperId ? Boolean(loadingByUserId[helperId]) : false);
    const acceptedBid = useMemo(
        () => bids.find((bid) => bid.status === "ACCEPTED") ?? null,
        [bids]
    );
    const isCompletedOwnerView = isOwner && request?.status === "COMPLETED";
    const showOwnerBidList = Boolean(isOwner && request && request.status !== "COMPLETED");
    const showOwnerActionBar = Boolean(isOwner && request && request.status !== "COMPLETED");
    const showHelperSubmitState = Boolean(
        !isOwner && request && isRequestOpenForBidding(request.status) && !myBid
    );
    const showHelperBidState = Boolean(!isOwner && myBid);

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

    const handleOpenBidChat = useCallback(
        (bidRequestId: string) => {
            router.push(`/messages/chat?requestId=${bidRequestId}` as never);
        },
        [router]
    );

    const handleOpenEditBidModal = useCallback((bid: Bid) => {
        setEditingBid(bid);
    }, []);

    const handleCloseEditBidModal = useCallback(() => {
        if (savingBid) {
            return;
        }

        setEditingBid(null);
    }, [savingBid]);

    const handleSubmitEditBid = useCallback(
        async (payload: { amount?: number; message?: string }) => {
            if (!editingBid) {
                return;
            }

            const amount =
                typeof payload.amount === "number" ? payload.amount : editingBid.amount;
            const message =
                typeof payload.message === "string"
                    ? payload.message
                    : editingBid.message ?? "";

            setSavingBid(true);
            try {
                const updated = await updateMyBid(editingBid.id, amount, message);
                if (!updated) {
                    return;
                }

                setEditingBid(null);
                showSuccessToast("Bid updated successfully");
            } finally {
                setSavingBid(false);
            }
        },
        [editingBid, updateMyBid]
    );

    const syncHelperReviews = useCallback(async () => {
        if (!helperId) {
            return null;
        }

        return getUserReviews(helperId, {
            limit: 10,
            forceRefresh: true,
        });
    }, [getUserReviews, helperId]);

    const handleOpenReviewModal = useCallback(async () => {
        await syncHelperReviews();
        setReviewModalVisible(true);
    }, [syncHelperReviews]);

    const handleStatusUpdate = useCallback(async (status: HelpRequestStatus) => {
        const updated = await setRequestStatus(status);

        if (
            updated &&
            status === "COMPLETED" &&
            (updated.assignedHelperId || helperId)
        ) {
            const reviewResult = await getUserReviews(updated.assignedHelperId || helperId!, {
                limit: 10,
                forceRefresh: true,
            });

            const alreadyReviewed = reviewResult?.reviews?.some(
                (review) =>
                    review.helpRequest.id === requestIdValue &&
                    review.reviewer.id === currentUserId
            );

            if (!alreadyReviewed) {
                setReviewModalVisible(true);
            }
        }

        return updated;
    }, [currentUserId, getUserReviews, helperId, requestIdValue, setRequestStatus]);

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
                <RequestDetailsSkeleton />
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

    const favoriteAction = (
        <AppButton
            title={favorited ? "Saved" : "Save"}
            variant={favorited ? "secondary" : "ghost"}
            loading={favoriteLoading}
            onPress={() => {
                void toggleFavorite(request);
            }}
            icon={
                <Ionicons
                    name={favorited ? "heart" : "heart-outline"}
                    size={16}
                    color={favorited ? palette.textPrimary : palette.textPrimary}
                />
            }
        />
    );

    const headerActionContent = showHelperSubmitState ? (
        <Stack gap="sm">
            {favoriteAction}
            <View
                style={[
                    styles.helperActionPanel,
                    {
                        backgroundColor: palette.primarySoft ?? palette.surfaceMuted,
                        borderColor: palette.primary,
                    },
                ]}
            >
                <Text style={[styles.helperActionEyebrow, { color: palette.primary }]}>
                    Ready to help
                </Text>
                <Text style={[styles.helperActionTitle, { color: palette.textPrimary }]}>
                    Submit your offer
                </Text>
                <Text style={[styles.helperActionCopy, { color: palette.textSecondary }]}>
                    Send your price and a short message without leaving this request.
                </Text>
                <AppButton
                    title="Submit offer"
                    onPress={handleOpenBidModal}
                    loading={loading}
                    disabled={loading}
                />
            </View>
        </Stack>
    ) : showHelperBidState && myBid ? (
        <Stack gap="sm">
            {favoriteAction}
            <View
                style={[
                    styles.helperActionPanel,
                    {
                        backgroundColor: palette.successSoft ?? palette.surfaceMuted,
                        borderColor: palette.success,
                    },
                ]}
            >
                <Row gap="xs" align="center">
                    <Ionicons name="checkmark-circle-outline" size={16} color={palette.success} />
                    <Text style={[styles.helperActionEyebrow, { color: palette.success }]}>
                        Your bid
                    </Text>
                </Row>
                <Text style={[styles.myBidAmount, { color: palette.textPrimary }]}>
                    €{myBid.amount.toFixed(2)}
                </Text>
                <Text style={[styles.helperActionCopy, { color: palette.textSecondary }]}>
                    {myBid.message || "Waiting for the requester to respond to your offer."}
                </Text>
                <View style={styles.inlineActionRow}>
                    <View style={styles.inlineActionCell}>
                        <AppButton
                            title="Edit bid"
                            variant="secondary"
                            onPress={() => handleOpenEditBidModal(myBid)}
                            disabled={Boolean(actionLoadingByBidId[myBid.id])}
                        />
                    </View>
                    <View style={styles.inlineActionCell}>
                        <AppButton
                            title="Withdraw"
                            variant="ghost"
                            onPress={() => deleteMyBid(myBid.id)}
                            disabled={Boolean(actionLoadingByBidId[myBid.id])}
                        />
                    </View>
                </View>
            </View>
        </Stack>
    ) : (
        <View style={styles.favoriteDock}>{favoriteAction}</View>
    );

    const headerStateLabel = isCompletedOwnerView
        ? "Closure"
        : isOwner
            ? "Owner view"
            : showHelperBidState
                ? "Waiting"
                : "Opportunity";
    const headerStateTitle = isCompletedOwnerView
        ? `Completed${acceptedBid?.helperName ? ` by ${acceptedBid.helperName}` : ""}`
        : isOwner
            ? request.status === "OPEN"
                ? "Review incoming offers and choose your helper"
                : "Track the accepted helper and move the request forward"
            : showHelperBidState
                ? "Your offer is in"
                : "This request is open for offers";
    const headerStateDescription = isCompletedOwnerView
        ? existingReview
            ? "The job is done. Review details stay here in case you want to update your feedback."
            : "The job is done. Leave a review now to close the loop and strengthen trust."
        : isOwner
            ? request.status === "OPEN"
                ? "Bid amounts and helper credibility are the main signals that matter now."
                : "You already chose a helper. Messaging and completion are the next meaningful actions."
            : showHelperBidState
                ? "Stay calm here. You can edit or withdraw while the bid is still pending."
                : "Scan the work, save it if needed, or place an offer while bidding stays open.";

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

            <RequestDetailsHeader
                request={request}
                isOwner={isOwner}
                actionContent={headerActionContent}
                stateLabel={headerStateLabel}
                stateTitle={headerStateTitle}
                stateDescription={headerStateDescription}
            />

            {isCompletedOwnerView && helperId ? (
                <Card
                    style={[
                        styles.reviewFocusCard,
                        {
                            backgroundColor: palette.warningSoft ?? palette.surfaceMuted,
                            borderColor: palette.warning,
                        },
                    ]}
                >
                    <Stack gap="sm">
                        <View
                            style={[
                                styles.sectionPill,
                                {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.warning,
                                },
                            ]}
                        >
                            <Ionicons
                                name="star-outline"
                                size={14}
                                color={palette.warning}
                            />
                            <Text
                                style={[
                                    styles.sectionPillText,
                                    { color: palette.warning },
                                ]}
                            >
                                Review helper
                            </Text>
                        </View>

                        <Text style={[styles.reviewFocusTitle, { color: palette.textPrimary }]}>
                            {existingReview
                                ? "Your feedback is the final step"
                                : "Rate your helper now that the job is done"}
                        </Text>

                        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                            {existingReview
                                ? "You already left a review. Update it here if the final outcome changed."
                                : "Close the request with a rating and short comment so future members can trust this helper."}
                        </Text>

                        {existingReview ? (
                            <ReviewCard review={existingReview} showRequestContext={false} />
                        ) : null}

                        <AppButton
                            title={existingReview ? "Edit review" : "Leave review"}
                            onPress={() => {
                                void handleOpenReviewModal();
                            }}
                            loading={reviewLoading}
                            disabled={reviewLoading}
                        />
                    </Stack>
                </Card>
            ) : null}

            {request.images?.length ? (
                <RequestPhotoUploadSection
                    title="Uploaded photos"
                    description="Photos attached to this request."
                    existingImages={request.images}
                    selectedImages={[]}
                    readOnly
                />
            ) : null}

            {showOwnerActionBar ? (
                <RequestActionBar
                    request={request}
                    loading={loading}
                    deleting={deleting}
                    onEdit={() => router.push(requestEditRoute(request.id))}
                    onUpdateStatus={handleStatusUpdate}
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

            {showOwnerBidList ? (
                <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
                    <Stack gap="sm">
                        <View style={[styles.sectionPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                            <Ionicons name="receipt-outline" size={14} color={palette.textSecondary} />
                            <Text style={[styles.sectionPillText, { color: palette.textSecondary }]}>Incoming offers</Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Bidder Offers</Text>

                        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                            Review each offer, accept the best fit, or message the accepted bidder directly.
                        </Text>

                        <BidList
                            bids={bids}
                            title="Incoming bids"
                            listPadding="none"
                            emptyMessage="No bids yet for this request."
                            canRespond
                            canModify={false}
                            actionLoadingByBidId={actionLoadingByBidId}
                            onBidAccept={(bid) => acceptBid(bid.id)}
                            onBidReject={(bid) => rejectBid(bid.id)}
                            onBidMessage={(bid) => handleOpenBidChat(bid.helpRequestId)}
                            onRetry={fetchDetails}
                        />
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

                    const created = await submitBid(payload.amount, payload.message);
                    if (!created) {
                        return;
                    }

                    setBidModalVisible(false);
                    showSuccessToast("Bid submitted successfully");
                }}
            />

            <ReviewComposerModal
                visible={reviewModalVisible}
                onClose={() => setReviewModalVisible(false)}
                helpRequestId={request.id}
                requestTitle={request.title}
                helperName={
                    bids.find((bid) => bid.helperId === helperId && bid.status === "ACCEPTED")
                        ?.helperName
                }
                initialReview={existingReview}
                loading={reviewLoading}
                error={reviewError}
                onSubmit={async (payload) => {
                    if (existingReview) {
                        await updateReview(existingReview.id, payload);
                    } else {
                        await createReview(payload as Parameters<typeof createReview>[0]);
                    }

                    await syncHelperReviews();
                    setReviewModalVisible(false);
                }}
            />

            <EditBidModal
                visible={Boolean(editingBid)}
                bid={editingBid}
                loading={savingBid}
                onClose={handleCloseEditBidModal}
                onSubmit={handleSubmitEditBid}
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        borderRadius: 16,
    },
    reviewFocusCard: {
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
    reviewFocusTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        lineHeight: 30,
    },
    helperActionPanel: {
        borderWidth: 1,
        borderRadius: 16,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    helperActionEyebrow: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    helperActionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    helperActionCopy: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 20,
    },
    myBidAmount: {
        fontSize: 28,
        fontWeight: "800",
        lineHeight: 32,
    },
    inlineActionRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
    },
    inlineActionCell: {
        flex: 1,
    },
    favoriteDock: {
        alignItems: "stretch",
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
    },
});

export default RequestDetailsScreen;
