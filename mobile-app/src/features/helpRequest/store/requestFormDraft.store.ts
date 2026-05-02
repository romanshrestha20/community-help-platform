import { create } from "zustand";

import { RequestFormState } from "@/features/helpRequest/types/requestForm.types";

type DraftState = {
  drafts: Record<string, RequestFormState>;
  saveDraft: (key: string, form: RequestFormState) => void;
  getDraft: (key: string) => RequestFormState | null;
  clearDraft: (key: string) => void;
};

export const useRequestFormDraftStore = create<DraftState>((set, get) => ({
  drafts: {},
  saveDraft: (key, form) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: form,
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
