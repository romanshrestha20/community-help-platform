import { useState } from "react";
import { HelpRequest } from "@/features/helpRequest/components";
import { showToast } from "@/utils/toast";
import { useBid } from "./bid.hook";

interface UseBidRequestFlowOptions {
    onSuccess?: () => Promise<void> | void;
}

export const useBidRequestFlow = ({ onSuccess }: UseBidRequestFlowOptions = {}) => {
    const { createBid, error: bidError } = useBid();
    const [bidModalVisible, setBidModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
    const [submittingBid, setSubmittingBid] = useState(false);

    const openBidModal = (request: HelpRequest) => {
        setSelectedRequest(request);
        setBidModalVisible(true);
    };

    const closeBidModal = () => {
        setBidModalVisible(false);
        setSelectedRequest(null);
    };

    const handleSubmitBid = async (data: { amount?: number; message?: string }) => {
        if (!selectedRequest?.id) {
            return;
        }

        const amount = Number(data.amount);
        const message = String(data.message || "").trim();

        setSubmittingBid(true);
        try {
            const created = await createBid({
                helpRequestId: selectedRequest.id,
                amount,
                message,
            });

            if (!created) {
                showToast("Could not submit bid");
                return;
            }

            showToast("Bid submitted successfully");
            closeBidModal();
            await onSuccess?.();
        } finally {
            setSubmittingBid(false);
        }
    };

    return {
        bidModalVisible,
        selectedRequest,
        submittingBid,
        bidError,
        openBidModal,
        closeBidModal,
        handleSubmitBid,
    };
};