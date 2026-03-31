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
};

export const BidRequestDetail: React.FC<BidRequestDetailProps> = ({
    requestId,
    initialRequest,
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

    const bids = useMemo(() => bidsByRequestId[requestId] || [], [bidsByRequestId, requestId]);

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
        if (!authUser || !request?.requesterId) return false;
        return authUser.id === request.requesterId;
    }, [authUser, request?.requesterId]);

    const isHelper = useMemo(() => {
        return Boolean(authUser?.id) && !isRequester;
    }, [authUser?.id, isRequester]);

    const acceptedBidId = useMemo(() => {
        return bids.find((bid) => bid.status === "ACCEPTED")?.id;
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
        <ScrollView contentContainerStyle={styles.container}>
            <Card style={styles.section}>
                <Stack gap="sm">
                    <Text style={styles.titleText}>{request.title}</Text>
                    <Text style={[styles.captionText, { color: colors.textSecondary }]}>{request.description}</Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.captionText}>Status: {request.status}</Text>
                        <Text style={styles.captionText}>Bids: {bids.length}</Text>
                    </View>
                </Stack>
            </Card>

            <Card style={styles.section}>
                <BidList
                    title="Bids"
                    bids={bids}
                    loading={Boolean(loadingByRequestId[requestId]) || bidLoading}
                    error={bidError}
                    canRespond={isRequester}
                    canModify={isHelper}
                    disableRespondActions={disableRespondActions}
                    actionLoadingByBidId={actionLoadingByBidId}
                    onBidAccept={(bid) => handleRespond(bid, "ACCEPTED")}
                    onBidReject={(bid) => handleRespond(bid, "REJECTED")}
                    onRetry={() => loadBids(true)}
                />
            </Card>

            {isHelper && request.status === "OPEN" && !hasMyBid && (
                <Card style={styles.section}>
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
                <Card style={styles.section}>
                    <Text style={styles.captionText}>You already placed a bid for this request.</Text>
                </Card>
            )}
        </ScrollView>
    );
};

export const BidDetail = BidRequestDetail;

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.md,
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
    titleText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.lg,
        lineHeight: typography.lineHeight.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textPrimary,
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
