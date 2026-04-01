import { create } from "zustand";
import type { ThemeMode } from "@/types/tabBar";
import { getThemeMode, saveThemeMode } from "@/utils/themePreference";

type ThemeState = {
    themeMode: ThemeMode;
    isHydrated: boolean;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    initializeThemeMode: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
    themeMode: "system",
    isHydrated: false,

    setThemeMode: async (mode) => {
        set({ themeMode: mode });
        await saveThemeMode(mode);
    },

    initializeThemeMode: async () => {
        if (get().isHydrated) return;

        const storedMode = await getThemeMode();
        set({ themeMode: storedMode, isHydrated: true });
    },
}));
