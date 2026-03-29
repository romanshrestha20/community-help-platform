// src/types/bid.types.ts

export type BidStatus = "ACCEPTED" | "REJECTED";

export interface Bid {
    id: string;
    helpRequestId: string;
    helperId: string;

    message: string;
    amount: number;
    status: BidStatus;

    helperName: string;
    helperEmail: string;

    createdAt: string;
    updatedAt: string;
}

export interface CreateBidData {
    helpRequestId: string;
    message: string;
    amount: number;
}

export interface UpdateBidData {
    message?: string;
    amount?: number;
}

export interface RespondBidData {
    status: BidStatus;
}

export interface BidResponse {
    success: boolean;
    data: Bid;
    message?: string;
}

