import * as bidService from "../services/bid.service";
import { CreateBidData, UpdateBidData, BidStatus, Bid } from "../types/bid.types";
import { useAsync } from "@/utils/useAsync";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RespondBidStatus = Exclude<BidStatus, "PENDING">;

export const useBid = () => {
    const { loading, error, run } = useAsync();
    const [bidsByRequestId, setBidsByRequestId] = useState<Record<string, Bid[]>>({});
    const [loadingByRequestId, setLoadingByRequestId] = useState<Record<string, boolean>>({});
    const [actionLoadingByBidId, setActionLoadingByBidId] = useState<Record<string, boolean>>({});
    const bidsByRequestIdRef = useRef<Record<string, Bid[]>>({});

    useEffect(() => {
        bidsByRequestIdRef.current = bidsByRequestId;
    }, [bidsByRequestId]);

    const getCachedBids = useCallback((helpRequestId: string) => {
        return bidsByRequestId[helpRequestId] || [];
    }, [bidsByRequestId]);

    const createBid = useCallback(async (data: CreateBidData) => {
        const created = await run(() => bidService.createBid(data));

        if (created) {
            setBidsByRequestId((prev) => {
                const existing = prev[data.helpRequestId] || [];
                return {
                    ...prev,
                    [data.helpRequestId]: [created, ...existing],
                };
            });
        }

        return created;
    }, [run]);

    const getBidById = useCallback((id: string) => {
        return run(() => bidService.getBidById(id));
    }, [run]);

    const getBidsByHelpRequestId = useCallback(async (helpRequestId: string, options?: { forceRefresh?: boolean }) => {
        const forceRefresh = options?.forceRefresh ?? false;
        const cachedBids = bidsByRequestIdRef.current[helpRequestId];

        if (!forceRefresh && cachedBids) {
            return cachedBids;
        }

        setLoadingByRequestId((prev) => ({ ...prev, [helpRequestId]: true }));

        try {
            const bids = await run(() => bidService.getBidsByHelpRequestId(helpRequestId));
            if (bids) {
                // Guard against accidental cross-request payloads.
                const requestScopedBids = bids.filter((bid) => bid.helpRequestId === helpRequestId);
                setBidsByRequestId((prev) => ({ ...prev, [helpRequestId]: requestScopedBids }));
                return requestScopedBids;
            }
            return bids;
        } finally {
            setLoadingByRequestId((prev) => ({ ...prev, [helpRequestId]: false }));
        }
    }, [run]);

    const getMyBids = useCallback(() => {
        return run(() => bidService.getMyBids());
    }, [run]);


    const updateBid = useCallback(async (id: string, data: UpdateBidData) => {
        const updated = await run(() => bidService.updateBid(id, data));

        if (updated) {
            setBidsByRequestId((prev) => {
                const next: Record<string, Bid[]> = {};

                for (const [requestId, bids] of Object.entries(prev)) {
                    next[requestId] = bids.map((bid) =>
                        bid.id === id ? { ...bid, ...updated } : bid
                    );
                }

                return next;
            });
        }

        return updated;
    }, [run]);

    const respondToBid = useCallback(async (id: string, data: RespondBidStatus, helpRequestId?: string) => {
        setActionLoadingByBidId((prev) => ({ ...prev, [id]: true }));
        try {
            const updated = await run(() => bidService.respondToBid(id, data));
            if (updated && helpRequestId) {
                setBidsByRequestId((prev) => ({
                    ...prev,
                    [helpRequestId]: (prev[helpRequestId] || []).map((bid) =>
                        bid.id === id ? { ...bid, ...updated } : bid,
                    ),
                }));
            }
            return updated;
        } finally {
            setActionLoadingByBidId((prev) => ({ ...prev, [id]: false }));
        }
    }, [run]);

    const respondToBidOptimistic = useCallback(async (id: string, status: RespondBidStatus, helpRequestId: string) => {
        const previousBids = bidsByRequestId[helpRequestId] || [];

        if (!previousBids.length) {
            return respondToBid(id, status, helpRequestId);
        }

        const optimisticBids = previousBids.map((bid) => {
            if (bid.id === id) {
                return { ...bid, status };
            }

            if (status === "ACCEPTED" && bid.status === "PENDING") {
                return { ...bid, status: "REJECTED" as BidStatus };
            }

            return bid;
        });

        setBidsByRequestId((prev) => ({ ...prev, [helpRequestId]: optimisticBids }));

        const updated = await respondToBid(id, status, helpRequestId);
        if (!updated) {
            setBidsByRequestId((prev) => ({ ...prev, [helpRequestId]: previousBids }));
            return null;
        }

        return updated;
    }, [bidsByRequestId, respondToBid]);

    const acceptBid = useCallback((id: string, helpRequestId?: string) => {
        return respondToBid(id, "ACCEPTED", helpRequestId);
    }, [respondToBid]);

    const rejectBid = useCallback((id: string, helpRequestId?: string) => {
        return respondToBid(id, "REJECTED", helpRequestId);
    }, [respondToBid]);

    const deleteBid = useCallback(async (id: string) => {
        const result = await run(() => bidService.deleteBid(id));

        setBidsByRequestId((prev) => {
            const next: Record<string, Bid[]> = {};

            for (const [requestId, bids] of Object.entries(prev)) {
                next[requestId] = bids.filter((bid) => bid.id !== id);
            }

            return next;
        });

        return result;
    }, [run]);

    const hasAcceptedBid = useCallback((helpRequestId: string) => {
        return (bidsByRequestId[helpRequestId] || []).some((bid) => bid.status === "ACCEPTED");
    }, [bidsByRequestId]);

    const isAnyBidActionLoading = useMemo(() => {
        return Object.values(actionLoadingByBidId).some(Boolean);
    }, [actionLoadingByBidId]);

    return {
        loading,
        error,
        bidsByRequestId,
        loadingByRequestId,
        actionLoadingByBidId,
        isAnyBidActionLoading,
        getCachedBids,
        hasAcceptedBid,
        createBid,
        getBidById,
        getBidsByHelpRequestId,
        getMyBids,
        updateBid,
        respondToBid,
        respondToBidOptimistic,
        acceptBid,
        rejectBid,
        deleteBid,
    };
};
