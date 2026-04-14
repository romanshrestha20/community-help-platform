import { HelpRequest, HelpRequestStatus } from "../types/helpRequest.types";
import { getReadableLocationLabel } from "@/features/location/utils/distance";

export const REQUEST_STATUS_LABELS: Record<HelpRequestStatus, string> = {
    OPEN: "Open",
    ASSIGNED: "Assigned",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

export const REQUEST_CATEGORY_LABELS: Record<string, string> = {
    errands: "Errands",
    transportation: "Transportation",
    "health-support": "Health Support",
    "home-help": "Home Help",
    "pet-care": "Pet Care",
    moving: "Moving",
    "outdoor-help": "Outdoor Help",
};

export const getRequestCategoryLabel = (request: HelpRequest) => {
    if (request.category?.name?.trim()) {
        return request.category.name;
    }

    if (request.category?.slug) {
        return REQUEST_CATEGORY_LABELS[request.category.slug] ?? request.category.slug;
    }

    return "Uncategorized";
};

export const formatRequestBudget = (request: HelpRequest) => {
    if (!request.isPaid) return "Unpaid";
    if (typeof request.budget !== "number") return "Budget not set";
    return `€${request.budget.toFixed(2)}`;
};

export const formatRequestLocation = (request: HelpRequest) => {
    const locationLabel = getReadableLocationLabel(request.location);

    return (
        locationLabel ||
        [request.city, request.country].filter(Boolean).join(", ") ||
        "Location not set"
    );
};

export const formatRequestCreatedAt = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
