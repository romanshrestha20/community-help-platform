// useHomeData.ts
import { useState, useCallback } from "react";
import { HelpRequest, useHelpRequest } from "@/features/helpRequest/components";
import { Bid, useBid } from "@/features/bid/components";

export const useHomeData = () => {
    const { getMyHelpRequests } = useHelpRequest();
    const { getBidsByHelpRequestId } = useBid();

    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [recentBids, setRecentBids] = useState<Bid[]>([]);

    const loadHomeData = useCallback(async () => {
        const myRequests = (await getMyHelpRequests()) ?? [];
        setRequests(myRequests);

        if (!myRequests.length) {
            setRecentBids([]);
            return;
        }

        const bidsByRequest = await Promise.all(
            myRequests.map((r) => getBidsByHelpRequestId(r.id))
        );

        const flattenedBids = bidsByRequest
            .flatMap((bids) => bids ?? [])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRecentBids(flattenedBids.slice(0, 5));
    }, [getMyHelpRequests, getBidsByHelpRequestId]);

    return { requests, recentBids, loadHomeData };
};