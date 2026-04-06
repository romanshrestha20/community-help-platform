import { AppLocation } from "@/features/location/types/location.types";
import { HelpRequestStatus } from "../types/helpRequest.types";

export const REQUEST_TITLE_MIN_LENGTH = 5;
export const REQUEST_TITLE_MAX_LENGTH = 120;
export const REQUEST_DESCRIPTION_MIN_LENGTH = 20;
export const REQUEST_DESCRIPTION_MAX_LENGTH = 1200;

type ParseBudgetResult = {
    budget?: number;
    error?: string;
};

type ValidateRequestDraftArgs = {
    title: string;
    description: string;
    budgetInput: string;
    location: AppLocation | null;
};

const ALLOWED_STATUS_TRANSITIONS: Record<HelpRequestStatus, HelpRequestStatus[]> = {
    OPEN: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
};

export const parseBudgetInput = (budgetInput: string): ParseBudgetResult => {
    const trimmed = budgetInput.trim();
    if (!trimmed) {
        return { budget: undefined };
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return { error: "Budget must be a valid number greater than 0." };
    }

    return { budget: numeric };
};

export const validateRequestDraft = ({
    title,
    description,
    budgetInput,
    location,
}: ValidateRequestDraftArgs): string | null => {
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle || !normalizedDescription) {
        return "Title and description are required.";
    }

    if (normalizedTitle.length < REQUEST_TITLE_MIN_LENGTH) {
        return `Title must be at least ${REQUEST_TITLE_MIN_LENGTH} characters.`;
    }

    if (normalizedTitle.length > REQUEST_TITLE_MAX_LENGTH) {
        return `Title must be ${REQUEST_TITLE_MAX_LENGTH} characters or fewer.`;
    }

    if (normalizedDescription.length < REQUEST_DESCRIPTION_MIN_LENGTH) {
        return `Description must be at least ${REQUEST_DESCRIPTION_MIN_LENGTH} characters.`;
    }

    if (normalizedDescription.length > REQUEST_DESCRIPTION_MAX_LENGTH) {
        return `Description must be ${REQUEST_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
    }

    const budgetResult = parseBudgetInput(budgetInput);
    if (budgetResult.error) {
        return budgetResult.error;
    }

    if (!location) {
        return "Please choose a location.";
    }

    return null;
};

export const canTransitionRequestStatus = (
    currentStatus: HelpRequestStatus,
    nextStatus: HelpRequestStatus,
) => {
    if (currentStatus === nextStatus) {
        return false;
    }

    return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
};

export const canDeleteRequest = (status: HelpRequestStatus) => {
    return status === "OPEN" || status === "CANCELLED";
};

export const isRequestOpenForBidding = (status: HelpRequestStatus) => {
    return status === "OPEN";
};
