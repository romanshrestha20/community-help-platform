import type { HelpRequest } from "../types/helpRequest.types";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const isUrgentRequestActive = (request?: Pick<HelpRequest, "isUrgent" | "urgentExpiresAt"> | null) => {
  if (!request?.isUrgent) return false;
  if (!request.urgentExpiresAt) return true;
  return new Date(request.urgentExpiresAt).getTime() > Date.now();
};

export const getUrgentTimeRemainingLabel = (urgentExpiresAt?: string | null) => {
  if (!urgentExpiresAt) return "No expiry";

  const remainingMs = new Date(urgentExpiresAt).getTime() - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return "Expired";

  if (remainingMs >= HOUR_MS) {
    const hours = Math.floor(remainingMs / HOUR_MS);
    const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS);
    return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
  }

  const minutes = Math.max(1, Math.floor(remainingMs / MINUTE_MS));
  return `${minutes}m left`;
};

export const formatUrgentDurationLabel = (minutes: number) => {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  }
  return `${minutes}m`;
};

