// src/features/user/store/user.store.ts

import { create } from "zustand";
import { User } from "../user.types";

type UserState = {
    user: User | null;
    loading: boolean;
    error: string | null;

    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearUser: () => set({ user: null, error: null }),
}));