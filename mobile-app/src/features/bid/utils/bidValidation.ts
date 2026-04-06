import { BidStatus } from "../types/bid.types";
import { HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";

export const BID_MESSAGE_MIN_LENGTH = 10;
export const BID_MESSAGE_MAX_LENGTH = 600;

type ParseBidAmountResult = {
    amount?: number;
    error?: string;
};

type ValidateBidDraftArgs = {
    amountInput: string;
    message: string;
    helpRequestId?: string;
    requestStatus?: HelpRequestStatus;
    mode: "create" | "edit";
};

export const parseBidAmountInput = (amountInput: string): ParseBidAmountResult => {
    const trimmed = amountInput.trim();
    if (!trimmed) {
        return { error: "Bid amount is required." };
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return { error: "Bid amount must be greater than 0." };
    }

    return { amount: numeric };
};

export const validateBidDraft = ({
    amountInput,
    message,
    helpRequestId,
    requestStatus,
    mode,
}: ValidateBidDraftArgs): string | null => {
    if (mode === "create" && !helpRequestId) {
        return "Unable to submit bid without a request id.";
    }

    const parsedAmount = parseBidAmountInput(amountInput);
    if (parsedAmount.error) {
        return parsedAmount.error;
    }

    const normalizedMessage = message.trim();
    if (normalizedMessage.length < BID_MESSAGE_MIN_LENGTH) {
        return `Message must be at least ${BID_MESSAGE_MIN_LENGTH} characters.`;
    }

    if (normalizedMessage.length > BID_MESSAGE_MAX_LENGTH) {
        return `Message must be ${BID_MESSAGE_MAX_LENGTH} characters or fewer.`;
    }

    if (requestStatus && requestStatus !== "OPEN") {
        return "Bidding is only available while a request is open.";
    }

    return null;
};

export const canMutateBid = (status: BidStatus) => {
    return status === "PENDING";
};
