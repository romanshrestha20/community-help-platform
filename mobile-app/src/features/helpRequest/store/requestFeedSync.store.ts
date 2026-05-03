import { create } from "zustand";

type RequestFeedSyncState = {
  version: number;
  bump: () => void;
};

export const useRequestFeedSyncStore = create<RequestFeedSyncState>((set) => ({
  version: 0,
  bump: () =>
    set((state) => ({
      version: state.version + 1,
    })),
}));

