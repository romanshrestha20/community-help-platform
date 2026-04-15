import React, { useMemo, useState, useCallback, useEffect } from "react";
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

    const helperVisibleBids = useMemo(() => {
        return myBid ? [myBid] : [];
    }, [myBid]);
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

            <Card style={[styles.favoriteCard, { borderColor: palette.border }]}>
                <Stack gap="sm">
                    <View style={[styles.sectionPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                        <Ionicons name="heart-outline" size={14} color={palette.textSecondary} />
                        <Text style={[styles.sectionPillText, { color: palette.textSecondary }]}>Saved requests</Text>
                    </View>

                    <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                        {favorited ? "Saved for later" : "Save this request"}
                    </Text>

                    <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                        Keep this request in your saved list so you can come back to it quickly.
                    </Text>

                    <AppButton
                        title={favorited ? "Saved" : "Save request"}
                        variant={favorited ? "secondary" : "primary"}
                        loading={favoriteLoading}
                        onPress={() => {
                            void toggleFavorite(request);
                        }}
                        icon={
                            <Ionicons
                                name={favorited ? "heart" : "heart-outline"}
                                size={16}
                                color={favorited ? palette.textPrimary : palette.textInverse}
                            />
                        }
                    />
                </Stack>
            </Card>

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
                    onUpdateStatus={handleStatusUpdate}
                    onDelete={handleDeleteRequest}
                />
            ) : null}

            {isOwner && request.status === "COMPLETED" && helperId ? (
                <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
                    <Stack gap="sm">
                        <View
                            style={[
                                styles.sectionPill,
                                {
                                    backgroundColor: palette.surfaceMuted,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Ionicons
                                name="star-outline"
                                size={14}
                                color={palette.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.sectionPillText,
                                    { color: palette.textSecondary },
                                ]}
                            >
                                Helper review
                            </Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                            {existingReview ? "Your review" : "Rate your helper"}
                        </Text>

                        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                            {existingReview
                                ? "You can update the feedback you left for this completed request."
                                : "Leave a rating and short comment now that the request is complete."}
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

            {actionError ? (
                <Card style={[styles.alertCard, { backgroundColor: palette.dangerSoft, borderColor: palette.danger }]}>
                    <Text style={[styles.errorText, { color: palette.danger }]}>
                        {actionError}
                    </Text>
                </Card>
            ) : null}

            {isOwner ? (
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
                            onBidMessage={(bid) => handleOpenBidChat(bid.helpRequestId)}
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
        </Screen>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        borderRadius: 16,
    },
    favoriteCard: {
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
