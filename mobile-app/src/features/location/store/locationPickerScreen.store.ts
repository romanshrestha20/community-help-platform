import { create } from "zustand";

import { AppLocation } from "@/features/location/types/location.types";

type LocationPickerScreenState = {
  draftLocation: AppLocation | null;
  draftOwnerId: string | null;
  draftReturnRoute: string | null;
  confirmedLocation: AppLocation | null;
  confirmedOwnerId: string | null;
  confirmedReturnRoute: string | null;
  setDraftLocation: (
    location: AppLocation | null,
    ownerId: string,
    returnRoute: string
  ) => void;
  confirmLocation: (location: AppLocation | null) => void;
  consumeConfirmedLocation: (ownerId: string) => AppLocation | null;
  getConfirmedReturnRoute: (ownerId: string) => string | null;
  clearLocationPickerState: () => void;
};

export const useLocationPickerScreenStore = create<LocationPickerScreenState>(
  (set, get) => ({
    draftLocation: null,
    draftOwnerId: null,
    draftReturnRoute: null,
    confirmedLocation: null,
    confirmedOwnerId: null,
    confirmedReturnRoute: null,
    setDraftLocation: (location, ownerId, returnRoute) =>
      set({
        draftLocation: location,
        draftOwnerId: ownerId,
        draftReturnRoute: returnRoute,
        confirmedLocation: null,
        confirmedOwnerId: null,
        confirmedReturnRoute: null,
      }),
    confirmLocation: (location) =>
      set({
        draftLocation: location,
        confirmedLocation: location,
        confirmedOwnerId: get().draftOwnerId,
        confirmedReturnRoute: get().draftReturnRoute,
      }),
    consumeConfirmedLocation: (ownerId) => {
      const state = get();
      if (state.confirmedOwnerId !== ownerId) {
        return null;
      }

      const location = state.confirmedLocation;
      set({
        confirmedLocation: null,
        confirmedOwnerId: null,
        confirmedReturnRoute: null,
      });
      return location;
    },
    getConfirmedReturnRoute: (ownerId) => {
      const state = get();
      if (state.confirmedOwnerId !== ownerId) {
        return null;
      }

      return state.confirmedReturnRoute;
    },
    clearLocationPickerState: () =>
      set({
        draftLocation: null,
        draftOwnerId: null,
        draftReturnRoute: null,
        confirmedLocation: null,
        confirmedOwnerId: null,
        confirmedReturnRoute: null,
      }),
  })
);
