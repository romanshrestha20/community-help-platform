const track = (name: string, payload?: Record<string, unknown>) => {
  if (__DEV__) {
    console.log(`[request-form] ${name}`, payload ?? {});
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
  editRequestValidationFailed: (field?: string) =>
    track("edit_request_validation_failed", { field: field ?? null }),
  editRequestSuccess: (requestId?: string) => track("edit_request_success", { requestId: requestId ?? null }),
};
