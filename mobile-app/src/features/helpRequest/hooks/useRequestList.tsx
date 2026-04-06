import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { HelpRequest } from "../types/helpRequest.types";
import { useHelpRequest } from "./helpRequest.hook";

type Scope = "mine" | "browse";

type UseRequestListOptions = {
    params?: Record<string, any>;
    scope?: Scope;
    autoFetch?: boolean;
};

const resolveRequesterId = (request: HelpRequest) => {
    const requester = (request as HelpRequest & { requester?: { id?: string; userId?: string } }).requester;
    return request.requesterId || requester?.id || requester?.userId || null;
};

export const useRequestList = ({
    params,
    scope = "mine",
    autoFetch = true,
}: UseRequestListOptions = {}) => {
    const user = useAuthStore((state) => state.user);
    const currentUserId = user?.id || user?.profile?.userId;
    const { loading, error, getMyHelpRequests } = useHelpRequest();
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = useCallback(async () => {
        const result = await getMyHelpRequests(params);
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

            setRequests(scoped);
        }
    }, [currentUserId, getMyHelpRequests, params, scope]);

    const refreshRequests = useCallback(async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    }, [fetchRequests]);

    useEffect(() => {
        if (!autoFetch) return;
        fetchRequests();
    }, [autoFetch, fetchRequests]);

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