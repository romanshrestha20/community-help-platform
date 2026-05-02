import { create } from "zustand";

import { AppLocation } from "@/features/location/types/location.types";
import { RequestImageUploadInput } from "@/features/helpRequest/types/helpRequest.types";
import { RequestFormState } from "@/features/helpRequest/types/requestForm.types";

type RequestDraft = {
  form: RequestFormState;
  location: AppLocation | null;
  selectedImages: RequestImageUploadInput[];
};

type RequestDraftState = {
  drafts: Record<string, RequestDraft>;
  saveDraft: (key: string, draft: RequestDraft) => void;
  getDraft: (key: string) => RequestDraft | null;
  clearDraft: (key: string) => void;
};

export const buildRequestDraftKey = (requestId?: string) =>
  requestId ? `edit-request-${requestId}` : "create-request";

export const useRequestDraftStore = create<RequestDraftState>((set, get) => ({
  drafts: {},
  saveDraft: (key, draft) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: draft,
      },
    })),
  getDraft: (key) => get().drafts[key] ?? null,
  clearDraft: (key) =>
    set((state) => {
      if (!state.drafts[key]) return state;
      const { [key]: _removed, ...rest } = state.drafts;
      return { drafts: rest };
    }),
}));
