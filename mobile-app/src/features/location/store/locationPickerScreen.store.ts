import { create } from "zustand";

import { AppLocation } from "@/features/location/types/location.types";

type LocationPickerScreenState = {
  draftLocation: AppLocation | null;
  confirmedLocation: AppLocation | null;
  setDraftLocation: (location: AppLocation | null) => void;
  confirmLocation: (location: AppLocation | null) => void;
  consumeConfirmedLocation: () => AppLocation | null;
  clearLocationPickerState: () => void;
};

export const useLocationPickerScreenStore = create<LocationPickerScreenState>(
  (set, get) => ({
    draftLocation: null,
    confirmedLocation: null,
    setDraftLocation: (location) =>
      set({
        draftLocation: location,
        confirmedLocation: null,
      }),
    confirmLocation: (location) =>
      set({
        draftLocation: location,
        confirmedLocation: location,
      }),
    consumeConfirmedLocation: () => {
      const location = get().confirmedLocation;
      set({ confirmedLocation: null });
      return location;
    },
    clearLocationPickerState: () =>
      set({
        draftLocation: null,
        confirmedLocation: null,
      }),
  })
);
