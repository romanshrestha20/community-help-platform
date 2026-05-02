const logEvent = (event: string, payload?: Record<string, unknown>) => {
  if (__DEV__) {
    console.log(`[form-events] ${event}`, payload ?? {});
  }
};

export const formEvents = {
  formStarted: (form: string) => logEvent("form_started", { form }),
  formValidationFailed: (form: string, field?: string) =>
    logEvent("form_validation_failed", { form, field: field ?? null }),
  formSubmitStarted: (form: string) => logEvent("form_submit_started", { form }),
  formSubmitFailed: (form: string, reason?: string) =>
    logEvent("form_submit_failed", { form, reason: reason ?? null }),
  formSubmitSuccess: (form: string) => logEvent("form_submit_success", { form }),
  locationPickerOpened: (form: string) => logEvent("location_picker_opened", { form }),
  locationSelected: (form: string) => logEvent("location_selected", { form }),
  draftRestored: (form: string, key: string) => logEvent("draft_restored", { form, key }),
  draftCleared: (form: string, key: string) => logEvent("draft_cleared", { form, key }),
  unsavedGuardShown: (form: string) => logEvent("unsaved_guard_shown", { form }),
};
