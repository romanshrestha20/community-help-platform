import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/features/auth/store/auth.store";
import * as bidService from "@/features/bid/services/bid.service";
import { Bid } from "@/features/bid/types/bid.types";
import * as helpRequestService from "@/features/helpRequest/services/helpRequest.service";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";

const sortByLatest = <T extends { updatedAt?: string; createdAt: string }>(items: T[]) =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.updatedAt ?? left.createdAt).getTime();
    const rightTime = new Date(right.updatedAt ?? right.createdAt).getTime();
    return rightTime - leftTime;
  });

const resolveRequesterId = (request: HelpRequest) => {
  const requester = (request as HelpRequest & { requester?: { id?: string; userId?: string } }).requester;
  return request.requesterId || requester?.id || requester?.userId || null;
};

export const useProfileActivity = () => {
  const authUser = useAuthStore((state) => state.user);
  const currentUserId = authUser?.id ?? authUser?.profile?.userId ?? null;

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setError(null);

    try {
      const [loadedRequests, loadedBids] = await Promise.all([
        helpRequestService.getAllHelpRequests(),
        bidService.getMyBids(),
      ]);

      const ownRequests = (loadedRequests ?? []).filter((request) => {
        if (!currentUserId) {
          return true;
        }

        return resolveRequesterId(request) === currentUserId;
      });

      setRequests(sortByLatest(ownRequests));
      setBids(sortByLatest(loadedBids ?? []));
      return true;
    } catch (caughtError) {
      setRequests([]);
      setBids([]);
      setError(caughtError instanceof Error ? caughtError.message : "Could not load activity");
      return false;
    }
  }, [currentUserId]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        if (isMounted) {
          await fetchActivity();
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
  }, [fetchActivity]);

  const refreshActivity = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchActivity();
    } finally {
      setRefreshing(false);
    }
  }, [fetchActivity]);

  const summary = useMemo(() => {
    const activeRequests = requests.filter((request) =>
      request.status === "OPEN" || request.status === "ASSIGNED"
    ).length;
    const completedRequests = requests.filter((request) => request.status === "COMPLETED").length;
    const pendingBids = bids.filter((bid) => bid.status === "PENDING").length;
    const acceptedBids = bids.filter((bid) => bid.status === "ACCEPTED").length;

    return {
      totalRequests: requests.length,
      totalBids: bids.length,
      activeRequests,
      completedRequests,
      pendingBids,
      acceptedBids,
    };
  }, [bids, requests]);

  return {
    requests,
    bids,
    loading,
    refreshing,
    error,
    summary,
    refreshActivity,
  };
};
