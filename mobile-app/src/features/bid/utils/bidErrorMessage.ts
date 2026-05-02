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

  return base;
};
