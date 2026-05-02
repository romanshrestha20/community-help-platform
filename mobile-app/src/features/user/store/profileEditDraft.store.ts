import { create } from "zustand";

import { ExperienceLevel, Gender, UpdateUserSkillInput, UserType } from "@/features/user/types/user.types";

type ProfileEditDraft = {
  fullName: string;
  phoneCountryCode: string;
  phoneCallingCode: string;
  phoneNationalNumber: string;
  bio: string;
  dateOfBirth: string;
  gender?: Gender;
  userType: UserType;
  selectedSkills: UpdateUserSkillInput[];
  certificationName: string;
  certificationIssuer: string;
  certificationCredentialId: string;
  certificationIssuedAt: string;
  certificationExpiresAt: string;
};

type ProfileEditDraftState = {
  drafts: Record<string, ProfileEditDraft>;
  saveDraft: (key: string, draft: ProfileEditDraft) => void;
  getDraft: (key: string) => ProfileEditDraft | null;
  clearDraft: (key: string) => void;
};

export const useProfileEditDraftStore = create<ProfileEditDraftState>((set, get) => ({
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

export const buildProfileDraftKey = (userId?: string | null) => `profile:${userId ?? "me"}`;

export const emptySkill: UpdateUserSkillInput = {
  skillId: "",
  experienceLevel: ExperienceLevel.INTERMEDIATE,
  yearsExperience: null,
  isPrimary: false,
};
