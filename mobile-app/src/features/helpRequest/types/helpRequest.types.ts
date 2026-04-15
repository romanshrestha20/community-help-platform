// src/types/helpRequest.types.ts
import { AppLocation } from "@/features/location/types/location.types";
import { AppCategory } from "@/features/category/types/category.types";

export interface HelpRequest {
    id: string;
    requesterId?: string;
    assignedHelperId?: string | null;
    title: string;
    description: string;
    categoryId?: string | null;
    category: AppCategory | null;

    budget?: number;
    isPaid: boolean;
    status: HelpRequestStatus;

    city?: string | null;
    country?: string | null;
    location?: AppLocation | null;

    requesterName: string;

    images?: HelpRequestImage[];

    createdAt: string;
    updatedAt?: string;

    bidCount: number;
    favoritedAt?: string | null;
}

export interface HelpRequestImage {
    id: string;
    url: string;
    type?: string;
    requestId?: string;
}

export interface RequestImageUploadInput {
    uri: string;
    name?: string;
    type?: string;
    webFile?: File | Blob;
}

export type HelpRequestStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface CreateHelpRequestData {
    title: string;
    description: string;
    categoryId: string;

    budget?: number;
    isPaid?: boolean;
    location: AppLocation | null;

    city?: string;
    country?: string;
}

export interface UpdateHelpRequestData {
    title?: string;
    description?: string;
    categoryId?: string;

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
