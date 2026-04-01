import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/design-system/layout/Card";
import { Stack } from "@/design-system/layout/Stack";
import { AppButton } from "@/components/ui/AppButton";
import { colors, spacing, typography } from "@/design-system";
import { showToast } from "@/utils/toast";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useHelpRequest } from "@/features/helpRequest/hooks/helpRequest.hook";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { Bid, BidStatus, CreateBidData } from "../types/bid.types";
import { BidForm } from "./BidForm";
import { BidList } from "./BidList";
import { useBid } from "../hooks/bid.hook";

type RespondBidStatus = Exclude<BidStatus, "PENDING">;

type BidRequestDetailProps = {
    requestId: string;
    initialRequest?: HelpRequest;
    forceRequesterActions?: boolean;
    compact?: boolean;
};

export const BidRequestDetail: React.FC<BidRequestDetailProps> = ({
    requestId,
    initialRequest,
    forceRequesterActions = false,
    compact = false,
}) => {
    const authUser = useAuthStore((state) => state.user);

    const { getHelpRequestById, loading: requestLoading, error: requestError } = useHelpRequest();
    const {
        loading: bidLoading,
        error: bidError,
        bidsByRequestId,
        loadingByRequestId,
        actionLoadingByBidId,
        createBid,
        getBidsByHelpRequestId,
        respondToBidOptimistic,
    } = useBid();

    const [request, setRequest] = useState<HelpRequest | null>(initialRequest || null);
    const [submittingBid, setSubmittingBid] = useState(false);
    const [selectedBidProfile, setSelectedBidProfile] = useState<Bid | null>(null);

    const bids = useMemo(() => {
        const cached = bidsByRequestId[requestId] || [];
        return cached.filter((bid) => bid.helpRequestId === requestId);
    }, [bidsByRequestId, requestId]);

    const loadRequest = useCallback(async () => {
        const loaded = await getHelpRequestById(requestId);
        if (loaded) {
            setRequest(loaded);
        }
    }, [getHelpRequestById, requestId]);

    const loadBids = useCallback(async (forceRefresh = false) => {
        await getBidsByHelpRequestId(requestId, { forceRefresh });
    }, [getBidsByHelpRequestId, requestId]);

    useEffect(() => {
        loadRequest();
        loadBids(false);
    }, [loadBids, loadRequest]);

    const isRequester = useMemo(() => {
        if (forceRequesterActions) return true;

        const currentUserId = authUser?.id || authUser?.profile?.userId;
        const requestOwnerId = request?.requesterId;

        if (!currentUserId || !requestOwnerId) return false;
        return currentUserId === requestOwnerId;
    }, [authUser?.id, authUser?.profile?.userId, forceRequesterActions, request?.requesterId]);

    const isHelper = useMemo(() => {
        return Boolean(authUser?.id) && !isRequester;
    }, [authUser?.id, isRequester]);

    const acceptedBidId = useMemo(() => {
        return bids.find((bid) => bid.status === "ACCEPTED")?.id;
    }, [bids]);

    // Requester sees all bids for this request
    // Helper sees only their own bid for this request
    const visibleBids = useMemo(() => {
        if (isRequester) return bids;
        if (!authUser?.id) return [];
        return bids.filter((bid) => bid.helperId === authUser.id);
    }, [bids, isRequester, authUser?.id]);

    const bidSummary = useMemo(() => {
        const pending = bids.filter((bid) => bid.status === "PENDING").length;
        const accepted = bids.filter((bid) => bid.status === "ACCEPTED").length;
        const rejected = bids.filter((bid) => bid.status === "REJECTED").length;

        return {
            total: bids.length,
            pending,
            accepted,
            rejected,
        };
    }, [bids]);

    const disableRespondActions = Boolean(acceptedBidId);

    const hasMyBid = useMemo(() => {
        if (!authUser?.id) return false;
        return bids.some((bid) => bid.helperId === authUser.id);
    }, [authUser?.id, bids]);

    const handleSubmitBid = useCallback(async (data: CreateBidData | Partial<CreateBidData>) => {
        if (!request || !requestId) return;

        const payload: CreateBidData = {
            helpRequestId: requestId,
            message: String(data.message || "").trim(),
            amount: Number(data.amount),
        };

        setSubmittingBid(true);
        try {
            const created = await createBid(payload);
            if (!created) {
                showToast("Failed to place bid");
                return;
            }

            showToast("Bid submitted");
            await loadBids(true);
        } finally {
            setSubmittingBid(false);
        }
    }, [createBid, loadBids, request, requestId]);

    const handleRespond = useCallback(async (bid: Bid, status: RespondBidStatus) => {
        const updated = await respondToBidOptimistic(bid.id, status, requestId);

        if (!updated) {
            showToast("Could not update bid. Changes were reverted.");
            return;
        }

        showToast(status === "ACCEPTED" ? "Bid accepted" : "Bid rejected");
        await loadRequest();
    }, [loadRequest, requestId, respondToBidOptimistic]);

    if (!request && requestLoading) {
        return (
            <View style={styles.centered}>
                <Text style={styles.bodyText}>Loading request...</Text>
            </View>
        );
    }

    if (!request) {
        return (
            <View style={styles.centered}>
                <Text style={styles.bodyText}>Request not found.</Text>
                {requestError && <Text style={styles.errorText}>{requestError}</Text>}
                <AppButton title="Retry" onPress={loadRequest} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, compact && styles.containerCompact]}>


            <Card style={[styles.section, compact && styles.compactCard]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{isRequester ? "View Bidders" : "My Bid"}</Text>
                    <Text style={styles.sectionSubtitle}>{visibleBids.length} visible</Text>
                </View>

                {isRequester && (
                    <View style={styles.bidStatsRow}>
                        <View style={styles.statChip}>
                            <Text style={styles.statChipLabel}>Total</Text>
                            <Text style={styles.statChipValue}>{bidSummary.total}</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Text style={styles.statChipLabel}>Pending</Text>
                            <Text style={styles.statChipValue}>{bidSummary.pending}</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Text style={styles.statChipLabel}>Accepted</Text>
                            <Text style={styles.statChipValue}>{bidSummary.accepted}</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Text style={styles.statChipLabel}>Rejected</Text>
                            <Text style={styles.statChipValue}>{bidSummary.rejected}</Text>
                        </View>
                    </View>
                )}

                {selectedBidProfile && (
                    <Card style={styles.profileCard}>
                        <Stack gap="xs">
                            <Text style={styles.sectionTitle}>Bidder Profile</Text>
                            <Text style={styles.captionText}>Name: {selectedBidProfile.helperName}</Text>
                            <Text style={styles.captionText}>
                                Email: {selectedBidProfile.helperEmail || "Not available"}
                            </Text>
                            <Text style={styles.captionText}>
                                Age: {typeof selectedBidProfile.helperAge === "number" ? selectedBidProfile.helperAge : "Not available"}
                            </Text>
                            <Text style={styles.captionText}>Bid Amount: ${selectedBidProfile.amount.toFixed(2)}</Text>
                            <Text style={styles.captionText}>Message: {selectedBidProfile.message}</Text>
                            <AppButton
                                title="Close Profile"
                                onPress={() => setSelectedBidProfile(null)}
                                variant="ghost"
                                fullWidth={false}
                            />
                        </Stack>
                    </Card>
                )}

                <BidList
                    title={isRequester ? "All Bids" : "My Bid"}
                    bids={visibleBids}
                    emptyMessage={isRequester ? "No bids yet" : "You have not placed a bid yet"}
                    listPadding="none"
                    loading={Boolean(loadingByRequestId[requestId]) || bidLoading}
                    error={bidError}
                    canRespond={isRequester}
                    canModify={isHelper}
                    disableRespondActions={disableRespondActions}
                    actionLoadingByBidId={actionLoadingByBidId}
                    onBidViewProfile={isRequester ? (bid) => setSelectedBidProfile(bid) : undefined}
                    onBidAccept={(bid) => handleRespond(bid, "ACCEPTED")}
                    onBidReject={(bid) => handleRespond(bid, "REJECTED")}
                    onRetry={() => loadBids(true)}
                />
            </Card>

            {isHelper && request.status === "OPEN" && !hasMyBid && (
                <Card style={[styles.section, compact && styles.compactCard]}>
                    <Text style={styles.sectionTitle}>Place a Bid</Text>
                    <BidForm
                        helpRequestId={requestId}
                        requestTitle={request.title}
                        onSubmit={handleSubmitBid}
                        loading={submittingBid}
                        error={bidError}
                    />
                </Card>
            )}

            {isHelper && hasMyBid && (
                <Card style={[styles.section, compact && styles.compactCard]}>
                    <Text style={styles.captionText}>You already placed a bid for this request.</Text>
                </Card>
            )}
        </ScrollView>
    );
};

export const BidDetail = BidRequestDetail;

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        gap: spacing.md,
    },
    containerCompact: {
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
    },
    section: {
        marginBottom: 0,
    },
    compactCard: {
        paddingHorizontal: spacing.sm,
    },
    requestOverviewCard: {
        borderWidth: 1,
        borderColor: colors.border,
    },
    profileCard: {
        marginBottom: spacing.md,
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: colors.surfaceMuted,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    sectionSubtitle: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        lineHeight: typography.lineHeight.xs,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 999,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
        gap: spacing.sm,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    summaryItem: {
        flexGrow: 1,
        minWidth: 88,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: colors.surface,
    },
    summaryLabel: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        lineHeight: typography.lineHeight.xs,
        fontWeight: typography.fontWeight.regular,
        color: colors.textSecondary,
    },
    summaryValue: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.md,
        lineHeight: typography.lineHeight.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textPrimary,
        marginTop: 2,
    },
    bidStatsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    statChip: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        minWidth: 74,
        backgroundColor: colors.surfaceMuted,
    },
    statChipLabel: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        lineHeight: typography.lineHeight.xs,
        fontWeight: typography.fontWeight.regular,
        color: colors.textSecondary,
    },
    statChipValue: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.md,
        lineHeight: typography.lineHeight.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textPrimary,
    },
    titleText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.lg,
        lineHeight: typography.lineHeight.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textPrimary,
    },
    eyebrowText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        lineHeight: typography.lineHeight.xs,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textSecondary,
        textTransform: "uppercase",
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.md,
        lineHeight: typography.lineHeight.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
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
    errorText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.sm,
        fontWeight: typography.fontWeight.regular,
        color: colors.danger,
    },
});