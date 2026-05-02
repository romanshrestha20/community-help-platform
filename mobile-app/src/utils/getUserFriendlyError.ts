type ErrorLike = {
  response?: { status?: number; data?: any };
  message?: string;
};

export const getUserFriendlyError = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  const candidate = error as ErrorLike;
  const status = candidate?.response?.status;
  const rawMessage =
    candidate?.response?.data?.message ||
    candidate?.response?.data?.error?.message ||
    candidate?.message ||
    "";

  const normalized = String(rawMessage).trim().toLowerCase();

  if (status === 401) return "Your session expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do this.";
  if (status === 404) return "This item no longer exists.";
  if (status === 400 || status === 422) return "Please check the highlighted fields.";

  if (normalized.includes("network") || normalized.includes("could not reach the server")) {
    return "You seem to be offline. Check your connection and try again.";
  }

  if (normalized.includes("internal server error")) {
    return "Service is temporarily unavailable. Please try again.";
  }

  return rawMessage || fallback;
};
