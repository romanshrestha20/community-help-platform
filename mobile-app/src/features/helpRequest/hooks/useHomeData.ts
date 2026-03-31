import { useState, useCallback } from "react";
import { HelpRequest, useHelpRequest } from "@/features/helpRequest/components";
import { Bid, useBid } from "@/features/bid/components";

export interface HomeFilters {
  status?: string;
  category?: string;
  sortBy?: "NEWEST" | "OLDEST" | "MOST_BIDS";
}

export const useHomeData = () => {
  const { getMyHelpRequests, createHelpRequest } = useHelpRequest();
  const { getBidsByHelpRequestId, getMyBids } = useBid();

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHomeData = useCallback(
    async (filters?: HomeFilters) => {
      setLoading(true);
      try {
        const myRequests = (await getMyHelpRequests()) ?? [];

        let filtered = [...myRequests];

        if (filters?.status && filters.status !== "ALL") {
          filtered = filtered.filter((r) => r.status === filters.status);
        }

        if (filters?.category && filters.category !== "ALL") {
          filtered = filtered.filter((r) => r.category === filters.category);
        }

        if (filters?.sortBy === "NEWEST") {
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        if (filters?.sortBy === "OLDEST") {
          filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        if (filters?.sortBy === "MOST_BIDS") {
          filtered.sort((a, b) => b.bidCount - a.bidCount);
        }

        setRequests(filtered);

        const helperBids = await getMyBids();
        setMyBids((helperBids ?? []).slice(0, 5));

        if (!filtered.length) {
          setRecentBids([]);
          return;
        }

        const bidsByRequest = await Promise.all(filtered.map((r) => getBidsByHelpRequestId(r.id)));

        const flattenedBids = bidsByRequest
          .flatMap((bids) => bids ?? [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRecentBids(flattenedBids.slice(0, 5));
      } finally {
        setLoading(false);
      }
    },
    [getMyHelpRequests, getBidsByHelpRequestId, getMyBids]
  );

  const addNewRequest = useCallback(
    async (data: Partial<HelpRequest>) => {
      await createHelpRequest(data);
      // Refresh after creating new request
      await loadHomeData();
    },
    [createHelpRequest, loadHomeData]
  );

  return { requests, recentBids, myBids, loading, loadHomeData, addNewRequest };
};