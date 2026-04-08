import * as helpRequestApi from "@/features/helpRequest/helpRequest.api";
import {
    ApiResponse,
    CreateHelpRequestData,
    HelpRequest,
    HelpRequestImage,
    HelpRequestStatus,
    RequestImageUploadInput,
    UpdateHelpRequestData,
} from "../types/helpRequest.types";

type UnknownRecord = Record<string, any>;

const handleResponse = <T>(response: ApiResponse<T>): T => {
    const { success, data, message } = response;

    if (!success) {
        throw new Error(message || "Request failed");
    }

    return data;
};

const normalizeImage = (image: UnknownRecord): HelpRequestImage | null => {
    if (!image || typeof image !== "object") return null;

    const resolvedUrl = image.url ?? image.uri ?? image.secureUrl ?? image.secure_url;
    if (!resolvedUrl) return null;

    return {
        id: image.id ?? resolvedUrl,
        url: resolvedUrl,
        type: image.type,
        requestId: image.requestId,
    };
};

const normalizeRequest = (request: UnknownRecord): HelpRequest => {
    const imagesSource =
        (Array.isArray(request.images) && request.images) ||
        (Array.isArray(request.requestImages) && request.requestImages) ||
        (Array.isArray(request.photos) && request.photos) ||
        [];

    return {
        ...request,
        images: imagesSource
            .map((image) => normalizeImage(image))
            .filter((image): image is HelpRequestImage => Boolean(image)),
    } as HelpRequest;
};

export const createHelpRequest = async (
    data: CreateHelpRequestData,
    images: RequestImageUploadInput[] = []
): Promise<HelpRequest> => {
    const response = images.length
        ? await helpRequestApi.createRequestWithImagesApi(data, images)
        : await helpRequestApi.createRequestApi(data);
    const payload = handleResponse<HelpRequest>(response.data) as UnknownRecord;
    return normalizeRequest(payload);
};

export const addHelpRequestImages = async (
    requestId: string,
    images: RequestImageUploadInput[]
): Promise<HelpRequestImage[]> => {
    const response = await helpRequestApi.addRequestImagesApi(requestId, images);
    const payload = handleResponse<HelpRequestImage[]>(response.data) as UnknownRecord[];
    return payload
        .map((image) => normalizeImage(image))
        .filter((image): image is HelpRequestImage => Boolean(image));
};

export const getAllHelpRequests = async (
    params?: Record<string, any>
): Promise<HelpRequest[]> => {
    const response = await helpRequestApi.getAllRequestsApi(params);
    const payload = handleResponse<HelpRequest[]>(response.data) as UnknownRecord[];
    return payload.map((request) => normalizeRequest(request));
};

export const getHelpRequestById = async (id: string): Promise<HelpRequest> => {
    const response = await helpRequestApi.getRequestByIdApi(id);
    const payload = handleResponse<HelpRequest>(response.data) as UnknownRecord;
    return normalizeRequest(payload);
};

export const updateHelpRequest = async (
    id: string,
    data: Partial<UpdateHelpRequestData>
): Promise<HelpRequest> => {
    const response = await helpRequestApi.updateRequestApi(id, data);
    const payload = handleResponse<HelpRequest>(response.data) as UnknownRecord;
    return normalizeRequest(payload);
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
    const payload = handleResponse<HelpRequest>(response.data) as UnknownRecord;
    return normalizeRequest(payload);
};