import { HelpRequestStatus } from "../types/helpRequest.types";
import {
    parseBudgetInput,
    REQUEST_DESCRIPTION_MAX_LENGTH,
    REQUEST_DESCRIPTION_MIN_LENGTH,
    REQUEST_TITLE_MAX_LENGTH,
    REQUEST_TITLE_MIN_LENGTH,
    validateRequestDraft,
} from "@/utils/validation/forms";

const ALLOWED_STATUS_TRANSITIONS: Record<HelpRequestStatus, HelpRequestStatus[]> = {
    OPEN: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
};

export {
    parseBudgetInput,
    REQUEST_DESCRIPTION_MAX_LENGTH,
    REQUEST_DESCRIPTION_MIN_LENGTH,
    REQUEST_TITLE_MAX_LENGTH,
    REQUEST_TITLE_MIN_LENGTH,
    validateRequestDraft,
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
