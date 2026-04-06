import * as helpRequestApi from "@/features/helpRequest/helpRequest.api";
import {
    ApiResponse,
    CreateHelpRequestData,
    HelpRequest,
    HelpRequestStatus,
    UpdateHelpRequestData,
} from "../types/helpRequest.types";

const handleResponse = <T>(response: ApiResponse<T>): T => {
    const { success, data, message } = response;

    if (!success) {
        throw new Error(message || "Request failed");
    }

    return data;
};

export const createHelpRequest = async (
    data: CreateHelpRequestData
): Promise<HelpRequest> => {
    const response = await helpRequestApi.createRequestApi(data);
    return handleResponse<HelpRequest>(response.data);
};

export const getAllHelpRequests = async (
    params?: Record<string, any>
): Promise<HelpRequest[]> => {
    const response = await helpRequestApi.getAllRequestsApi(params);
    return handleResponse<HelpRequest[]>(response.data);
};

export const getHelpRequestById = async (id: string): Promise<HelpRequest> => {
    const response = await helpRequestApi.getRequestByIdApi(id);
    return handleResponse<HelpRequest>(response.data);
};

export const updateHelpRequest = async (
    id: string,
    data: Partial<UpdateHelpRequestData>
): Promise<HelpRequest> => {
    const response = await helpRequestApi.updateRequestApi(id, data);
    return handleResponse<HelpRequest>(response.data);
};

export const deleteHelpRequest = async (id: string): Promise<void> => {
    const response = await helpRequestApi.deleteRequestApi(id);

    if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete help request");
    }
};

export const updateHelpRequestStatus = async (
    id: string,
    status: HelpRequestStatus
): Promise<HelpRequest> => {
    const response = await helpRequestApi.updateRequestStatusApi(id, status);
    return handleResponse<HelpRequest>(response.data);
};