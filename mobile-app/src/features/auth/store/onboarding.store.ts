import { create } from "zustand";

import type { AvatarUploadInput } from "@/features/user/types/user.types";

export type OnboardingRole = "HELPER" | "REQUESTER" | "BOTH";

type OnboardingState = {
  role: OnboardingRole;
  interestIds: string[];
  pendingAvatar: AvatarUploadInput | null;
  firstName: string;
  setRole: (role: OnboardingRole) => void;
  toggleInterest: (interestId: string) => void;
  setPendingAvatar: (avatar: AvatarUploadInput | null) => void;
  setFirstName: (firstName: string) => void;
  reset: () => void;
};

const defaultState = {
  role: "BOTH" as OnboardingRole,
  interestIds: [] as string[],
  pendingAvatar: null as AvatarUploadInput | null,
  firstName: "",
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...defaultState,
  setRole: (role) => set({ role }),
  toggleInterest: (interestId) =>
    set((state) => ({
      interestIds: state.interestIds.includes(interestId)
        ? state.interestIds.filter((id) => id !== interestId)
        : [...state.interestIds, interestId],
    })),
  setPendingAvatar: (pendingAvatar) => set({ pendingAvatar }),
  setFirstName: (firstName) => set({ firstName }),
  reset: () => set(defaultState),
}));
