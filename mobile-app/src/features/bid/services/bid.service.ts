import * as bidApi from '../api/bid.api';
import { Bid, CreateBidData, UpdateBidData } from '../types/bid.types';

export const handleResponse = <T>(response: any): T => {
    const { success, data, message } = response;

    if (!success || !data) {
        throw new Error(message || "Request failed");
    }
    return data as T;
};

export const createBid = async (data: CreateBidData): Promise<Bid> => {
    const response = await bidApi.createBidApi(data);
    return handleResponse<Bid>(response.data);
};

export const getBidsByHelpRequestId = async (helpRequestId: string): Promise<Bid[]> => {
    const response = await bidApi.getBidsByHelpRequestIdApi(helpRequestId);
    return handleResponse<Bid[]>(response.data);
};

export const getMyBids = async (): Promise<Bid[]> => {
    const response = await bidApi.getMyBidsApi();
    return handleResponse<Bid[]>(response.data);
};

export const updateBid = async (bidId: string, data: UpdateBidData): Promise<Bid> => {
    const response = await bidApi.updateBidApi(bidId, data);
    return handleResponse<Bid>(response.data);
};

export const respondToBid = async (bidId: string, status: "ACCEPTED" | "REJECTED"): Promise<Bid> => {
    const response = await bidApi.respondToBidApi(bidId, { status });
    return handleResponse<Bid>(response.data);
};

export const acceptBid = async (bidId: string): Promise<Bid> => {
    return respondToBid(bidId, "ACCEPTED");
};

export const rejectBid = async (bidId: string): Promise<Bid> => {
    return respondToBid(bidId, "REJECTED");
};

export const deleteBid = async (bidId: string): Promise<void> => {
    const response = await bidApi.deleteBidApi(bidId);
    if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete bid");
    }
};

export const getBidById = async (bidId: string): Promise<Bid> => {
    const response = await bidApi.getBidByIdApi(bidId);
    return handleResponse<Bid>(response.data);
};