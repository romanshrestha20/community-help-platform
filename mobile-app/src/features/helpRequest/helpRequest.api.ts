import apiClient from "@/api/api-client";
import { CreateHelpRequestData, HelpRequestStatus, UpdateHelpRequestData } from "./types/helpRequest.types";

export const createRequestApi = (data: CreateHelpRequestData) =>
    apiClient.post("/requests", data);

export const getAllRequestsApi = (params?: Record<string, any>) =>
    apiClient.get("/requests", { params });

export const getRequestByIdApi = (id: string) =>
    apiClient.get(`/requests/${id}`);

export const updateRequestApi = (id: string, data: Partial<UpdateHelpRequestData>) =>
    apiClient.put(`/requests/${id}`, data);


export const updateRequestStatusApi = (id: string, status: HelpRequestStatus) =>
    apiClient.patch(`/requests/${id}/status`, { status });

export const deleteRequestApi = (id: string) =>
    apiClient.delete(`/requests/${id}`);

