import * as bidApi from '../api/bid.api';
import { Bid, CreateBidData, UpdateBidData } from '../types/bid.types';

export const handleResponse = <T>(response: any): T => {
    const { success, data, message } = response;

    if (!success || !data) {
        throw new Error(message || "Request failed");
    }
    return data as T;
};

type UnknownRecord = Record<string, any>;

const normalizeBid = (bid: UnknownRecord): Bid => {
    const helper = (bid?.helper ?? {}) as UnknownRecord;
    const profile = (helper?.profile ?? {}) as UnknownRecord;
    const address = (profile?.address ?? {}) as UnknownRecord;

    return {
        ...bid,
        helperName: bid.helperName ?? profile.fullName ?? helper.email ?? "Community member",
        helperEmail: bid.helperEmail ?? helper.email ?? undefined,
        helperGender: bid.helperGender ?? profile.gender ?? undefined,
        helperAvatarUrl: bid.helperAvatarUrl ?? profile.avatarUrl ?? null,
        helperLocation:
            bid.helperLocation ??
            address.formattedAddress ??
            [address.city, address.country].filter(Boolean).join(", ") ??
            undefined,
    } as Bid;
};

export const createBid = async (data: CreateBidData): Promise<Bid> => {
    const response = await bidApi.createBidApi(data);
    return normalizeBid(handleResponse<Bid>(response.data) as UnknownRecord);
};

export const getBidsByHelpRequestId = async (helpRequestId: string): Promise<Bid[]> => {
    const response = await bidApi.getBidsByHelpRequestIdApi(helpRequestId);
    return handleResponse<Bid[]>(response.data).map((bid) => normalizeBid(bid as UnknownRecord));
};

export const getMyBids = async (): Promise<Bid[]> => {
    const response = await bidApi.getMyBidsApi();
    return handleResponse<Bid[]>(response.data).map((bid) => normalizeBid(bid as UnknownRecord));
};

export const updateBid = async (bidId: string, data: UpdateBidData): Promise<Bid> => {
    const response = await bidApi.updateBidApi(bidId, data);
    return normalizeBid(handleResponse<Bid>(response.data) as UnknownRecord);
};

export const respondToBid = async (bidId: string, status: "ACCEPTED" | "REJECTED"): Promise<Bid> => {
    const response = await bidApi.respondToBidApi(bidId, { status });
    return normalizeBid(handleResponse<Bid>(response.data) as UnknownRecord);
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
    return normalizeBid(handleResponse<Bid>(response.data) as UnknownRecord);
};
