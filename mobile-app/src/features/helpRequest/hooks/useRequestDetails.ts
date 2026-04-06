
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { HelpRequest } from "../types/helpRequest.types";
import { Bid } from "@/features/bid/types/bid.types";
import { useHelpRequest } from "../hooks/helpRequest.hook";
import { useBid } from "@/features/bid/hooks/bid.hook";
import { canMutateBid } from "@/features/bid/utils/bidValidation";
import {
    canDeleteRequest,
    canTransitionRequestStatus,
    isRequestOpenForBidding,
} from "../utils/requestValidation";

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
    const [actionError, setActionError] = useState<string | null>(null);

    const myBid = bids.find((bid) => bid.helperId === currentUserId) ?? null;
    const isOwner = Boolean(currentUserId && request?.requesterId && request.requesterId === currentUserId);

    const fetchDetails = useCallback(async () => {
        if (!requestId) return;
        setActionError(null);

        const [requestResult, bidsResult] = await Promise.all([
            getHelpRequestById(requestId),
            getBidsByHelpRequestId(requestId, { forceRefresh: true }),
        ]);

        if (requestResult) setRequest(requestResult);
        if (bidsResult) setBids(bidsResult);
    }, [getHelpRequestById, getBidsByHelpRequestId, requestId]);

    const acceptBid = useCallback(async (bidId: string) => {
        const targetBid = bids.find((bid) => bid.id === bidId);

        if (!isOwner) {
            setActionError("Only the request owner can accept bids.");
            return null;
        }

        if (!request || !isRequestOpenForBidding(request.status)) {
            setActionError("Bids can only be accepted while the request is open.");
            return null;
        }

        if (!targetBid || targetBid.status !== "PENDING") {
            setActionError("Only pending bids can be accepted.");
            return null;
        }

        setActionError(null);
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
    }, [bids, isOwner, request, requestId, respondToBidOptimistic]);

    const rejectBid = useCallback(async (bidId: string) => {
        const targetBid = bids.find((bid) => bid.id === bidId);

        if (!isOwner) {
            setActionError("Only the request owner can reject bids.");
            return null;
        }

        if (!targetBid || targetBid.status !== "PENDING") {
            setActionError("Only pending bids can be rejected.");
            return null;
        }

        setActionError(null);
        const updated = await respondToBidOptimistic(bidId, "REJECTED", requestId);
        if (updated) {
            setBids((prev) =>
                prev.map((bid) =>
                    bid.id === bidId ? { ...bid, status: "REJECTED" } : bid
                )
            );
        }
        return updated;
    }, [bids, isOwner, requestId, respondToBidOptimistic]);

    const submitBid = useCallback(async (amount: number, message: string) => {
        if (!request || !isRequestOpenForBidding(request.status)) {
            setActionError("This request is not open for bidding.");
            return null;
        }

        if (myBid && canMutateBid(myBid.status)) {
            setActionError("You already have a pending bid for this request.");
            return null;
        }

        setActionError(null);
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
    }, [createBid, myBid, request, requestId]);

    const updateMyBid = useCallback(async (bidId: string, amount: number, message: string) => {
        const targetBid = bids.find((bid) => bid.id === bidId);
        if (!targetBid || !canMutateBid(targetBid.status)) {
            setActionError("Only pending bids can be updated.");
            return null;
        }

        setActionError(null);
        const updated = await updateBid(bidId, { amount, message });
        if (updated) {
            setBids((prev) => prev.map((bid) => (bid.id === bidId ? { ...bid, ...updated } : bid)));
        }
        return updated;
    }, [bids, updateBid]);

    const deleteMyBid = useCallback(async (bidId: string) => {
        const targetBid = bids.find((bid) => bid.id === bidId);
        if (!targetBid || !canMutateBid(targetBid.status)) {
            setActionError("Only pending bids can be deleted.");
            return;
        }

        setActionError(null);
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
    }, [bids, deleteBid]);

    const setRequestStatus = useCallback(async (status: HelpRequest["status"]) => {
        if (!request) return null;

        if (!canTransitionRequestStatus(request.status, status)) {
            setActionError(`Cannot move request from ${request.status} to ${status}.`);
            return null;
        }

        setActionError(null);
        const updated = await updateHelpRequestStatus(requestId, status);
        if (updated) {
            setRequest((prev) => (prev ? { ...prev, ...updated } : updated));
        }
        return updated;
    }, [request, requestId, updateHelpRequestStatus]);

    const removeRequest = useCallback(async () => {
        if (!request) {
            setActionError("Request is unavailable.");
            return null;
        }

        if (!canDeleteRequest(request.status)) {
            setActionError("Only open or cancelled requests can be deleted.");
            return null;
        }

        setActionError(null);
        return deleteHelpRequest(request.id);
    }, [deleteHelpRequest, request]);

    useEffect(() => {
        if (!requestId) return;
        void fetchDetails();
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
        removeRequest,
        actionError,
        actionLoadingByBidId,
    };
};