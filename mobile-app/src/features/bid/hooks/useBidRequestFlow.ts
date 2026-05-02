import { useState } from "react";
import type { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
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
        if ((bidError || "").toLowerCase().includes("verification required")) {
          showErrorToast(
            "Email verification required",
            "Verify your email to send bids."
          );
          return;
        }
        showErrorToast("Error", "Failed to submit bid. Please try again.");
        return;
      }

      showSuccessToast("Bid submitted successfully");
      closeBidModal();
    } finally {
      setSubmittingBid(false);
    }

    void Promise.resolve(onSuccess?.());
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
