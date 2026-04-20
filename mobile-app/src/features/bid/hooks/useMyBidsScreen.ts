import { useCallback, useEffect, useState } from "react";

import { useBid } from "./bid.hook";
import { Bid } from "../types/bid.types";
import { canMutateBid } from "../utils/bidValidation";

export const useMyBidsScreen = () => {
    const { getMyBids, updateBid, deleteBid } = useBid();
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingBidId, setSavingBidId] = useState<string | null>(null);
    const [deletingBidId, setDeletingBidId] = useState<string | null>(null);
    const [editingBid, setEditingBid] = useState<Bid | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchBids = useCallback(async () => {
        setError(null);

        try {
            const loaded = await getMyBids();
            const safeBids = loaded ?? [];
            setBids(safeBids);
            return safeBids;
        } catch (caughtError) {
            const message =
                caughtError instanceof Error ? caughtError.message : "Could not load bids";
            setError(message);
            setBids([]);
            return [];
        }
    }, [getMyBids]);

    const refreshBids = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchBids();
        } finally {
            setRefreshing(false);
        }
    }, [fetchBids]);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                if (isMounted) {
                    await fetchBids();
                }
            } catch (caughtError) {
                if (isMounted) {
                    setError(caughtError instanceof Error ? caughtError.message : "Could not load bids");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [fetchBids]);

    const openEditBid = useCallback((bid: Bid) => {
        setEditingBid(bid);
    }, []);

    const closeEditBid = useCallback(() => {
        setEditingBid(null);
    }, []);

    const submitEditBid = useCallback(async (payload: { amount?: number; message?: string }) => {
        if (!editingBid) return;

        if (!canMutateBid(editingBid.status)) {
            setError("Only pending bids can be edited.");
            return;
        }

        setSavingBidId(editingBid.id);
        try {
            const updated = await updateBid(editingBid.id, payload);
            if (updated) {
                setBids((prev) => prev.map((bid) => (bid.id === editingBid.id ? { ...bid, ...updated } : bid)));
                setEditingBid(null);
            }
        } finally {
            setSavingBidId(null);
        }
    }, [editingBid, updateBid]);

    const removeBid = useCallback(async (bidId: string) => {
        const bidToDelete = bids.find((bid) => bid.id === bidId);
        if (!bidToDelete || !canMutateBid(bidToDelete.status)) {
            setError("Only pending bids can be deleted.");
            return false;
        }

        setDeletingBidId(bidId);
        try {
            await deleteBid(bidId);
            setBids((prev) => prev.filter((bid) => bid.id !== bidId));
            if (editingBid?.id === bidId) {
                setEditingBid(null);
            }
            return true;
        } finally {
            setDeletingBidId(null);
        }
    }, [bids, deleteBid, editingBid?.id]);

    return {
        bids,
        loading,
        refreshing,
        error,
        savingBidId,
        deletingBidId,
        editingBid,
        fetchBids,
        refreshBids,
        openEditBid,
        closeEditBid,
        submitEditBid,
        removeBid,
    };
};
