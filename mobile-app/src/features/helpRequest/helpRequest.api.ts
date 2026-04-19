import apiClient from "@/api/api-client";
import {
    CreateHelpRequestData,
    HelpRequestStatus,
    RequestImageUploadInput,
    UpdateHelpRequestData,
} from "./types/helpRequest.types";

const appendImageToFormData = (
    formData: FormData,
    image: RequestImageUploadInput,
    index: number
) => {
    if (image.webFile) {
        formData.append("images", image.webFile as any);
        return;
    }

    formData.append(
        "images",
        {
            uri: image.uri,
            name: image.name ?? `request-image-${Date.now()}-${index}.jpg`,
            type: image.type ?? "image/jpeg",
        } as any
    );
};

export const createRequestApi = (data: CreateHelpRequestData) => {
    if (!data.location) {
        throw new Error("Location is required");
    }

    const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        categoryId: data.categoryId,
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

export const createRequestWithImagesApi = (
    data: CreateHelpRequestData,
    images: RequestImageUploadInput[]
) => {
    if (!data.location) {
        throw new Error("Location is required");
    }

    const formData = new FormData();

    formData.append("title", data.title.trim());
    formData.append("description", data.description.trim());
    formData.append("categoryId", data.categoryId);

    if (typeof data.budget === "number") {
        formData.append("budget", String(data.budget));
    }

    if (typeof data.isPaid === "boolean") {
        formData.append("isPaid", String(data.isPaid));
    }

    formData.append(
        "location",
        JSON.stringify({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            addressLine1: data.location.addressLine1 ?? null,
            addressLine2: data.location.addressLine2 ?? null,
            city: data.location.city ?? data.city?.trim() ?? null,
            country: data.location.country ?? data.country?.trim() ?? null,
            state: data.location.state ?? null,
            postalCode: data.location.postalCode ?? null,
            formattedAddress: data.location.formattedAddress ?? null,
        })
    );

    images.forEach((image, index) => {
        appendImageToFormData(formData, image, index);
    });

    return apiClient.post("/requests", formData);
};

const buildRequestImagesFormData = (images: RequestImageUploadInput[]): FormData => {
    const formData = new FormData();

    images.forEach((image, index) => {
        appendImageToFormData(formData, image, index);
    });

    return formData;
};

export const addRequestImagesApi = (requestId: string, images: RequestImageUploadInput[]) => {
    if (!images.length) {
        throw new Error("At least one image is required");
    }

    const formData = buildRequestImagesFormData(images);

    return apiClient.post(`/requests/${requestId}/images`, formData);
};

export const getAllRequestsApi = (filters?: Record<string, any>) => {
    return apiClient.get("/requests", { params: filters ?? {} });
};
export const getNearbyRequestsApi = (filters?: Record<string, any>) => {
    return apiClient.get("/requests/nearby", { params: filters ?? {} });
};
export const getRequestByIdApi = (id: string) =>
    apiClient.get(`/requests/${id}`);

export const updateRequestApi = (id: string, data: Partial<UpdateHelpRequestData>) =>
    apiClient.patch(`/requests/${id}`, data);


export const updateRequestStatusApi = (id: string, status: HelpRequestStatus) =>
    apiClient.patch(`/requests/${id}/status`, { status });

export const deleteRequestApi = (id: string) =>
    apiClient.delete(`/requests/${id}`);
