import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
    useHomeData,
} from "@/features/helpRequest/components";
import { CreateHelpRequestData } from "@/features/helpRequest/types/helpRequest.types";
import { useGlobalFilters } from "@/features/helpRequest/hooks/useGlobalFilters";
import { useBidRequestFlow } from "@/features/bid/hooks";
import { Bid } from "@/features/bid/types/bid.types";
import { showErrorToast, showSuccessToast, showToast } from "@/utils/toast";

export const useHomeScreen = () => {
    const user = useAuthStore((state) => state.user);
    const currentUserId = user?.id || user?.profile?.userId;
    const { filters, updateFilter, resetFilters } = useGlobalFilters();
    const { requests, recentBids, myBids, loadHomeData, addNewRequest, deleteBid } = useHomeData();
    const [creatingRequest, setCreatingRequest] = useState(false);
    const [createRequestError, setCreateRequestError] = useState<string | null>(null);

    const {
        bidModalVisible,
        selectedRequest,
        submittingBid,
        bidError,
        openBidModal,
        closeBidModal,
        handleSubmitBid,
    } = useBidRequestFlow({
        onSuccess: () => loadHomeData(filters),
    });

    const filteredRequests = useMemo(() => {
        let next = [...requests];

        if (filters.status !== "ALL") {
            next = next.filter((request) => request.status === filters.status);
        }

        if (filters.category !== "ALL") {
            next = next.filter((request) => request.category === filters.category);
        }

        if (filters.sortBy === "NEWEST") {
            next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        if (filters.sortBy === "OLDEST") {
            next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        if (filters.sortBy === "MOST_BIDS") {
            next.sort((a, b) => b.bidCount - a.bidCount);
        }

        return next;
    }, [requests, filters]);

    const helperRequests = useMemo(() => {
        const getRequesterId = (request: (typeof filteredRequests)[number]) =>
            request.requesterId ||
            (request as (typeof filteredRequests)[number] & { requester?: { id?: string; userId?: string } })
                .requester?.id ||
            (request as (typeof filteredRequests)[number] & { requester?: { id?: string; userId?: string } })
                .requester?.userId ||
            null;

        if (!currentUserId) {
            return filteredRequests.filter((request) => Boolean(getRequesterId(request)));
        }

        return filteredRequests.filter(
            (request) => {
                const requesterId = getRequesterId(request);
                return Boolean(requesterId) && requesterId !== currentUserId;
            }
        );
    }, [currentUserId, filteredRequests]);

    const handleRemoveBid = useCallback(
        async (requestId: string) => {
            const matchingBid = myBids.find((bid: Bid) => bid.helpRequestId === requestId);

            if (!matchingBid) {
                showToast("info", "No bid found", "You do not have a bid on this request.");
                return;
            }

            const deleted = await deleteBid(matchingBid.id);

            if (deleted === null) {
                showErrorToast("Error", "Could not remove bid");
                return;
            }

            showSuccessToast("Bid removed successfully");
            await loadHomeData(filters);
        },
        [deleteBid, filters, loadHomeData, myBids]
    );

    useEffect(() => {
        loadHomeData();
    }, [loadHomeData]);

    const handleCreateRequest = async (data: CreateHelpRequestData) => {
        setCreateRequestError(null);
        setCreatingRequest(true);

        try {
            const created = await addNewRequest(data);
            showSuccessToast("Request posted successfully");
            return created;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not create request";
            setCreateRequestError(message);
            showErrorToast("Error", message);
            throw error;
        } finally {
            setCreatingRequest(false);
        }
    };

    return {
        filters,
        updateFilter,
        resetFilters,
        helperRequests,
        recentBids,
        myBids,
        creatingRequest,
        createRequestError,
        handleCreateRequest,
        bidModalVisible,
        selectedRequest,
        submittingBid,
        bidError,
        openBidModal,
        closeBidModal,
        handleSubmitBid,
        handleRemoveBid,
    };
};
