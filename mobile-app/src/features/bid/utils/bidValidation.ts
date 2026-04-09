import { BidStatus } from "../types/bid.types";
import {
    BID_MESSAGE_MAX_LENGTH,
    BID_MESSAGE_MIN_LENGTH,
    parseBidAmountInput,
    validateBidDraft,
} from "@/utils/validation/forms";

export {
    BID_MESSAGE_MAX_LENGTH,
    BID_MESSAGE_MIN_LENGTH,
    parseBidAmountInput,
    validateBidDraft,
};

export const canMutateBid = (status: BidStatus) => {
    return status === "PENDING";
};
