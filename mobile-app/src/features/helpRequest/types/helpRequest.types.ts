// src/types/helpRequest.types.ts
import { AppLocation } from "@/features/location/types/location.types";

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
    location?: AppLocation | null;

    requesterName: string;

    createdAt: string;
    updatedAt?: string;

    bidCount: number;
}

export type HelpRequestStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface CreateHelpRequestData {
    title: string;
    description: string;
    category: "FOOD" | "MEDICAL" | "EDUCATION" | "OTHER";

    budget?: number;
    isPaid?: boolean;
    location: AppLocation | null;

    city?: string;
    country?: string;
}

export interface UpdateHelpRequestData {
    title?: string;
    description?: string;
    category?: "FOOD" | "MEDICAL" | "EDUCATION" | "OTHER";

    budget?: number;
    isPaid?: boolean;
    location?: AppLocation;

    city?: string;
    country?: string;

    status?: HelpRequestStatus;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: {
        total?: number;
        page?: number;
        totalPages?: number;
    };
}