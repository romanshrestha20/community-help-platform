import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ThemeMode } from "@/types/tabBar";

const THEME_MODE_KEY = "theme_mode";

let inMemoryThemeMode: ThemeMode = "system";
let secureStoreAvailable: boolean | null = null;

const getWebStorage = () => {
    if (Platform.OS !== "web") return null;
    if (typeof window === "undefined") return null;
    return window.localStorage;
};

const canUseSecureStore = async () => {
    if (secureStoreAvailable !== null) return secureStoreAvailable;

    try {
        secureStoreAvailable = await SecureStore.isAvailableAsync();
    } catch {
        secureStoreAvailable = false;
    }

    return secureStoreAvailable;
};

const isThemeMode = (value: string | null): value is ThemeMode => {
    return value === "light" || value === "dark" || value === "system";
};

export const saveThemeMode = async (mode: ThemeMode) => {
    inMemoryThemeMode = mode;

    const webStorage = getWebStorage();
    if (webStorage) {
        webStorage.setItem(THEME_MODE_KEY, mode);
        return;
    }

    if (!(await canUseSecureStore())) return;

    try {
        await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
    } catch {
        // Ignore persistence errors; in-memory fallback already updated.
    }
};

export const getThemeMode = async (): Promise<ThemeMode> => {
    const webStorage = getWebStorage();
    if (webStorage) {
        const webValue = webStorage.getItem(THEME_MODE_KEY);
        return isThemeMode(webValue) ? webValue : "system";
    }

    if (await canUseSecureStore()) {
        try {
            const stored = await SecureStore.getItemAsync(THEME_MODE_KEY);
            if (isThemeMode(stored)) {
                inMemoryThemeMode = stored;
                return stored;
            }
        } catch {
            // Ignore and fall back to memory/default.
        }
    }

    return inMemoryThemeMode;
};
