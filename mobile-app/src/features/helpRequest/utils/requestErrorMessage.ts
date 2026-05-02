export const mapRequestErrorMessage = (message?: string | null) => {
  const normalized = (message ?? "").trim().toLowerCase();

  if (!normalized) return "Could not save request. Please try again.";
  if (normalized.includes("location") && normalized.includes("required")) {
    return "Location is required.";
  }
  if (normalized.includes("budget") && (normalized.includes("greater") || normalized.includes("valid"))) {
    return "Budget must be a valid amount greater than 0.";
  }
  if (normalized.includes("completed")) {
    return "You cannot edit a completed request.";
  }
  if (normalized.includes("not found")) {
    return "This request no longer exists.";
  }
  if (normalized.includes("network") || normalized.includes("could not reach the server")) {
    return "You seem to be offline. Check your connection and try again.";
  }
  if (normalized.includes("internal server error")) {
    return "Request service is temporarily unavailable. Please try again.";
  }

  return message ?? "Could not save request. Please try again.";
};
