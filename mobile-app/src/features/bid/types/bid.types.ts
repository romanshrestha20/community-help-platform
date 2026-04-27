// src/types/bid.types.ts

export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Bid {
    id: string;
    helpRequestId: string;
    helperId: string;

    message: string;
    amount: number;
    status: BidStatus;

    helperName: string;
    helperEmail?: string;
    helperAge?: number;
    helperRating?: number;
    helperTotalReviews?: number;
    helperCompletedHelps?: number;
    helperGender?: string;
    helperAvatarUrl?: string | null;
    helperLocation?: string;
    helperSkills?: {
        id: string;
        skillId: string;
        experienceLevel: string;
        yearsExperience?: number | null;
        isPrimary: boolean;
        skill: {
            id: string;
            name: string;
            slug: string;
        } | null;
    }[];
    helperPrimarySkills?: string[];
    helperApprovedCertifications?: {
        id: string;
        name: string;
        issuer: string;
        credentialId?: string | null;
        status: string;
        issuedAt?: string | null;
        expiresAt?: string | null;
        reviewedAt?: string | null;
    }[];

    createdAt: string;
    updatedAt?: string;
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
