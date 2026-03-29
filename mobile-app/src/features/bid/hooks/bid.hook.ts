
import * as bidService from "../services/bid.service";
import { CreateBidData, UpdateBidData, BidStatus, } from "../types/bid.types";
import { useAsync } from "@/utils/useAsync";
import { useCallback } from "react";

export const useBid = () => {
    const { loading, error, run } = useAsync();


    const createBid = useCallback((data: CreateBidData) =>
        run(() => bidService.createBid(data)), [run]);

    const getBidById = useCallback((id: string) => {
        return run(() => bidService.getBidById(id));
    }, [run]);

    const getBidsByHelpRequestId = useCallback((helpRequestId: string) => {
        return run(() => bidService.getBidsByHelpRequestId(helpRequestId));
    }, [run]);


    const updateBid = useCallback((id: string, data: UpdateBidData) => {
        return run(() => bidService.updateBid(id, data));
    }, [run]);

    const respondToBid = useCallback((id: string, data: BidStatus) => {
        return run(() => bidService.respondToBid(id, data));
    }, [run]);

    const deleteBid = useCallback((id: string) => {
        return run(() => bidService.deleteBid(id));
    }, [run]);

    return {
        loading,
        error,
        createBid,
        getBidById,
        getBidsByHelpRequestId,
        updateBid,
        respondToBid,
        deleteBid,
    };
}   