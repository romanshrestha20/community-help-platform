import { getUserFriendlyError } from "@/utils/getUserFriendlyError";

export const mapBidErrorMessage = (error: unknown, fallback = "Could not submit bid.") => {
  const base = getUserFriendlyError(error, fallback);
  const normalized = base.toLowerCase();

  if (normalized.includes("own request")) {
    return "You cannot bid on your own request.";
  }

  if (normalized.includes("no longer open") || normalized.includes("bidding is only available")) {
    return "This request is no longer open.";
  }

  if (
    normalized.includes("already bid") ||
    normalized.includes("already bidded") ||
    normalized.includes("already placed a bid") ||
    normalized.includes("duplicate bid") ||
    normalized.includes("bid already exists") ||
    normalized.includes("you already have a bid") ||
    normalized.includes("already submitted")
  ) {
    return "You already submitted an offer for this request.";
  }

  return base;
};
