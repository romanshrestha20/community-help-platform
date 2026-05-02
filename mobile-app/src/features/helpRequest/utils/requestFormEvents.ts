const RECENT_EVENT_WINDOW_MS = 700;
const recentEvents = new Map<string, number>();

const buildEventKey = (name: string, payload?: Record<string, unknown>) => {
  if (!payload) {
    return name;
  }

  return `${name}:${JSON.stringify(payload)}`;
};

const track = (name: string, payload?: Record<string, unknown>) => {
  if (__DEV__) {
    const key = buildEventKey(name, payload);
    const now = Date.now();
    const lastSeenAt = recentEvents.get(key) ?? 0;

    if (now - lastSeenAt < RECENT_EVENT_WINDOW_MS) {
      return;
    }

    recentEvents.set(key, now);
    const payloadEntries = payload ? Object.entries(payload) : [];
    const payloadText =
      payloadEntries.length > 0
        ? payloadEntries
            .map(([entryKey, value]) => `${entryKey}=${String(value)}`)
            .join(", ")
        : "{}";
    console.log(`[request-form] ${name} ${payloadText}`);
  }
};

export const requestFormEvents = {
  createRequestStarted: () => track("create_request_started"),
  createRequestValidationFailed: (field?: string) =>
    track("create_request_validation_failed", { field: field ?? null }),
  createRequestLocationSelected: () => track("create_request_location_selected"),
  createRequestReviewOpened: () => track("create_request_review_opened"),
  createRequestSubmitted: () => track("create_request_submitted"),
  createRequestFailed: (reason?: string) => track("create_request_failed", { reason: reason ?? null }),
  createRequestSuccess: (requestId?: string) => track("create_request_success", { requestId: requestId ?? null }),
  unsavedGuardShown: () => track("unsaved_guard_shown"),
  editRequestValidationFailed: (field?: string) =>
    track("edit_request_validation_failed", { field: field ?? null }),
  editRequestSuccess: (requestId?: string) => track("edit_request_success", { requestId: requestId ?? null }),
};
