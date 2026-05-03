import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { HelpRequest } from "../types/helpRequest.types";
import { useHelpRequest } from "./helpRequest.hook";
import { useRequestFeedSyncStore } from "../store/requestFeedSync.store";

type Scope = "mine" | "browse";

type UseRequestListOptions = {
    params?: Record<string, any>;
    scope?: Scope;
    autoFetch?: boolean;
    useNearbyEndpoint?: boolean;
};

const resolveRequesterId = (request: HelpRequest) => {
    const requester = (request as HelpRequest & { requester?: { id?: string; userId?: string } }).requester;
    return request.requesterId || requester?.id || requester?.userId || null;
};

export const useRequestList = ({
    params,
    scope = "mine",
    autoFetch = true,
    useNearbyEndpoint = false,
}: UseRequestListOptions = {}) => {
    const user = useAuthStore((state) => state.user);
    const requestFeedSyncVersion = useRequestFeedSyncStore((state) => state.version);
    const currentUserId = user?.id || user?.profile?.userId;
    const { loading, error, getMyHelpRequests, getNearbyHelpRequests } = useHelpRequest();
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = useCallback(async () => {
        const result = useNearbyEndpoint
            ? await getNearbyHelpRequests(params)
            : await getMyHelpRequests(params);
        if (result) {
            const scoped = result.filter((request) => {
                const requesterId = resolveRequesterId(request);

                if (!currentUserId) {
                    return scope === "mine" ? true : requesterId !== null;
                }

                return scope === "mine"
                    ? requesterId === currentUserId
                    : requesterId !== null && requesterId !== currentUserId;
            });

            const publicDiscoveryRequests =
                scope === "browse"
                    ? scoped.filter((request) => request.status === "OPEN")
                    : scoped;

            setRequests(publicDiscoveryRequests);
        }
    }, [currentUserId, getMyHelpRequests, getNearbyHelpRequests, params, scope, useNearbyEndpoint]);

    const refreshRequests = useCallback(async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    }, [fetchRequests]);

    useEffect(() => {
        if (!autoFetch) return;
        fetchRequests();
    }, [autoFetch, fetchRequests]);

    useEffect(() => {
        if (!autoFetch) return;
        void fetchRequests();
    }, [autoFetch, fetchRequests, requestFeedSyncVersion]);

    return {
        requests,
        loading,
        error,
        refreshing,
        fetchRequests,
        refreshRequests,
        setRequests,
    };
};
