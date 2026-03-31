// src/types/helpRequest.types.ts

export interface HelpRequest {
    id: string;
    requesterId?: string;
    title: string;
    description: string;
    category: "FOOD" | "MEDICAL" | "EDUCATION" | "OTHER";

    budget?: number;
    isPaid: boolean;
    status: HelpRequestStatus;

    city?: string | null;
    country?: string | null;

    requesterName: string;

    createdAt: string;
    updatedAt: string;

    bidCount: number;
}

export type HelpRequestStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface CreateHelpRequestData {
    title: string;
    description: string;
    category: "FOOD" | "MEDICAL" | "EDUCATION" | "OTHER";

    budget?: number;
    isPaid?: boolean;

    city?: string;
    country?: string;
}

export interface UpdateHelpRequestData {
    title?: string;
    description?: string;
    category?: "FOOD" | "MEDICAL" | "EDUCATION" | "OTHER";

    budget?: number;
    isPaid?: boolean;

    city?: string;
    country?: string;

    status?: HelpRequestStatus;
}

export interface HelpRequestResponse {
    success: boolean;
    data: HelpRequest;
    message?: string;
}