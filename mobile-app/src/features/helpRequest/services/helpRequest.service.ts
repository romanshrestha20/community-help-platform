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
import { AppCategory } from "@/features/category/types/category.types";

type UnknownRecord = Record<string, any>;

const normalizeCategory = (category: unknown): AppCategory | null => {
    if (!category || typeof category !== "object") {
        return null;
    }

    const value = category as UnknownRecord;
    const id = typeof value.id === "string" ? value.id : null;
    const name = typeof value.name === "string" ? value.name : null;
    const slug = typeof value.slug === "string" ? value.slug : null;

    if (!id || !name || !slug) {
        return null;
    }

    return {
        id,
        name,
        slug,
        icon: typeof value.icon === "string" ? value.icon : null,
        color: typeof value.color === "string" ? value.color : null,
        sortOrder: typeof value.sortOrder === "number" ? value.sortOrder : undefined,
    };
};

const handleResponse = <T>(response: ApiResponse<T>): T => {
    const { success, data, message } = response;

    if (!success) {
        throw new Error(message || "Request failed");
    }

    return data;
};

const normalizeImage = (image: unknown): HelpRequestImage | null => {
    if (!image) return null;

    if (typeof image === "string") {
        const trimmed = image.trim();
        if (!trimmed) return null;
        return {
            id: trimmed,
            url: trimmed,
        };
    }

    if (typeof image !== "object") return null;

    const value = image as UnknownRecord;
    const resolvedUrl =
        value.url ??
        value.uri ??
        value.imageUrl ??
        value.imageURL ??
        value.secureUrl ??
        value.secure_url;
    if (!resolvedUrl || typeof resolvedUrl !== "string") return null;

    return {
        id: (typeof value.id === "string" && value.id) ? value.id : resolvedUrl,
        url: resolvedUrl,
        type: typeof value.type === "string" ? value.type : undefined,
        requestId: typeof value.requestId === "string" ? value.requestId : undefined,
    };
};

const normalizeRequest = (request: UnknownRecord): HelpRequest => {
    const imagesSource =
        (Array.isArray(request.images) && request.images) ||
        (Array.isArray(request.requestImages) && request.requestImages) ||
        (Array.isArray(request.photos) && request.photos) ||
        (Array.isArray(request.imageUrls) && request.imageUrls) ||
        [];

    return {
        ...request,
        distanceKm:
            typeof request.distanceKm === "number" ? request.distanceKm : null,
        categoryId:
            typeof request.categoryId === "string"
                ? request.categoryId
                : normalizeCategory(request.category)?.id ?? null,
        category: normalizeCategory(request.category),
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

export const getNearbyHelpRequests = async (
    params?: Record<string, any>
): Promise<HelpRequest[]> => {
    const response = await helpRequestApi.getNearbyRequestsApi(params);
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
