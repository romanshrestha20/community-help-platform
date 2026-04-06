import apiClient from "@/api/api-client";
import { CreateHelpRequestData, HelpRequestStatus, UpdateHelpRequestData } from "./types/helpRequest.types";

export const createRequestApi = (data: CreateHelpRequestData) => {
    if (!data.location) {
        throw new Error("Location is required");
    }

    const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        budget: data.budget,
        location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            addressLine1: data.location.addressLine1 ?? null,
            addressLine2: data.location.addressLine2 ?? null,
            city: data.location.city ?? data.city?.trim() ?? null,
            country: data.location.country ?? data.country?.trim() ?? null,
            state: data.location.state ?? null,
            postalCode: data.location.postalCode ?? null,
            formattedAddress: data.location.formattedAddress ?? null,
        },
    };

    return apiClient.post("/requests", payload);
};

export const getAllRequestsApi = (filters?: Record<string, any>) => {
    return apiClient.get("/requests", { params: filters ?? {} });
};
export const getRequestByIdApi = (id: string) =>
    apiClient.get(`/requests/${id}`);

export const updateRequestApi = (id: string, data: Partial<UpdateHelpRequestData>) =>
    apiClient.patch(`/requests/${id}`, data);


export const updateRequestStatusApi = (id: string, status: HelpRequestStatus) =>
    apiClient.patch(`/requests/${id}/status`, { status });

export const deleteRequestApi = (id: string) =>
    apiClient.delete(`/requests/${id}`);

