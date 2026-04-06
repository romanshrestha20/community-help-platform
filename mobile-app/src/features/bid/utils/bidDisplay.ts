import { BidStatus } from "../types/bid.types";

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const formatBidAmount = (amount: number) => `€${amount}`;

export const formatBidCreatedAt = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};