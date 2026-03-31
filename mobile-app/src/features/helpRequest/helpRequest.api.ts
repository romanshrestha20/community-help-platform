import apiClient from "@/api/api-client";
import { CreateHelpRequestData, HelpRequestStatus, UpdateHelpRequestData } from "./types/helpRequest.types";

export const createRequestApi = (data: CreateHelpRequestData) => {
    const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        budget: data.budget,
        location: {
            // Backend currently requires latitude/longitude fields.
            latitude: 0,
            longitude: 0,
            radius: 800,
            city: data.city?.trim() || null,
            country: data.country?.trim() || null,
            state: null,
            street: null,
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
    apiClient.put(`/requests/${id}`, data);


export const updateRequestStatusApi = (id: string, status: HelpRequestStatus) =>
    apiClient.patch(`/requests/${id}/status`, { status });

export const deleteRequestApi = (id: string) =>
    apiClient.delete(`/requests/${id}`);

