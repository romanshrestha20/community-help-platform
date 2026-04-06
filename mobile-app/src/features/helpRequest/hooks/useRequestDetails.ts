
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { HelpRequest } from "../types/helpRequest.types";
import { Bid } from "@/features/bid/types/bid.types";
import { useHelpRequest } from "../hooks/helpRequest.hook";
import { useBid } from "@/features/bid/hooks/bid.hook";

export const useRequestDetails = (requestId: string) => {
    const {
        loading: requestLoading,
        error: requestError,
        getHelpRequestById,
        updateHelpRequestStatus,
        deleteHelpRequest,
    } = useHelpRequest();

    const {
        loading: bidLoading,
        error: bidError,
        getBidsByHelpRequestId,
        respondToBidOptimistic,
        createBid,
        updateBid,
        deleteBid,
        actionLoadingByBidId,
    } = useBid();

    const user = useAuthStore((state) => state.user);
    const currentUserId = user?.id || user?.profile?.userId;

    const [request, setRequest] = useState<HelpRequest | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);

    const fetchDetails = useCallback(async () => {
        if (!requestId) return;

        const [requestResult, bidsResult] = await Promise.all([
            getHelpRequestById(requestId),
            getBidsByHelpRequestId(requestId, { forceRefresh: true }),
        ]);

        if (requestResult) setRequest(requestResult);
        if (bidsResult) setBids(bidsResult);
    }, [getHelpRequestById, getBidsByHelpRequestId, requestId]);

    const acceptBid = useCallback(async (bidId: string) => {
        const updated = await respondToBidOptimistic(bidId, "ACCEPTED", requestId);
        if (updated) {
            setBids((prev) =>
                prev.map((bid) => {
                    if (bid.id === bidId) return { ...bid, status: "ACCEPTED" };
                    if (bid.status === "PENDING") return { ...bid, status: "REJECTED" };
                    return bid;
                })
            );
            setRequest((prev) => (prev ? { ...prev, status: "ASSIGNED" } : prev));
        }
        return updated;
    }, [respondToBidOptimistic, requestId]);

    const rejectBid = useCallback(async (bidId: string) => {
        const updated = await respondToBidOptimistic(bidId, "REJECTED", requestId);
        if (updated) {
            setBids((prev) =>
                prev.map((bid) =>
                    bid.id === bidId ? { ...bid, status: "REJECTED" } : bid
                )
            );
        }
        return updated;
    }, [respondToBidOptimistic, requestId]);

    const submitBid = useCallback(async (amount: number, message: string) => {
        const created = await createBid({
            helpRequestId: requestId,
            amount,
            message,
        });

        if (created) {
            setBids((prev) => [created, ...prev]);
            setRequest((prev) =>
                prev
                    ? {
                        ...prev,
                        bidCount: prev.bidCount + 1,
                    }
                    : prev
            );
        }

        return created;
    }, [createBid, requestId]);

    const updateMyBid = useCallback(async (bidId: string, amount: number, message: string) => {
        const updated = await updateBid(bidId, { amount, message });
        if (updated) {
            setBids((prev) => prev.map((bid) => (bid.id === bidId ? { ...bid, ...updated } : bid)));
        }
        return updated;
    }, [updateBid]);

    const deleteMyBid = useCallback(async (bidId: string) => {
        await deleteBid(bidId);
        setBids((prev) => prev.filter((bid) => bid.id !== bidId));
        setRequest((prev) =>
            prev
                ? {
                    ...prev,
                    bidCount: Math.max(prev.bidCount - 1, 0),
                }
                : prev
        );
    }, [deleteBid]);

    const setRequestStatus = useCallback(async (status: HelpRequest["status"]) => {
        const updated = await updateHelpRequestStatus(requestId, status);
        if (updated) {
            setRequest((prev) => (prev ? { ...prev, ...updated } : updated));
        }
        return updated;
    }, [requestId, updateHelpRequestStatus]);

    const myBid = bids.find((bid) => bid.helperId === currentUserId) ?? null;
    const isOwner = Boolean(currentUserId && request?.requesterId && request.requesterId === currentUserId);

    useEffect(() => {
        if (!requestId) return;
        fetchDetails();
    }, [fetchDetails, requestId]);

    return {
        request,
        bids,
        loading: requestLoading || bidLoading,
        error: requestError || bidError,
        isOwner,
        myBid,
        fetchDetails,
        acceptBid,
        rejectBid,
        submitBid,
        updateMyBid,
        deleteMyBid,
        setRequestStatus,
        updateHelpRequestStatus,
        deleteHelpRequest,
        actionLoadingByBidId,
    };
};