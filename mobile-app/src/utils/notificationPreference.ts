import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type NotificationPreferences = {
    pushEnabled: boolean;
    messagesEnabled: boolean;
    bidsEnabled: boolean;
    requestUpdatesEnabled: boolean;
    savedRequestsEnabled: boolean;
    nearbyAlertsEnabled: boolean;
    nearbyAlertRadiusKm: 1 | 3 | 5 | 10 | 25;
    nearbyAlertsUrgentOnly: boolean;
    nearbyAlertCategorySlugs: string[];
};

const NOTIFICATION_PREFERENCES_KEY = "notification_preferences";

const defaultPreferences: NotificationPreferences = {
    pushEnabled: true,
    messagesEnabled: true,
    bidsEnabled: true,
    requestUpdatesEnabled: true,
    savedRequestsEnabled: false,
    nearbyAlertsEnabled: false,
    nearbyAlertRadiusKm: 5,
    nearbyAlertsUrgentOnly: false,
    nearbyAlertCategorySlugs: [],
};

let inMemoryPreferences: NotificationPreferences = defaultPreferences;
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

const isNotificationPreferences = (
    value: unknown
): value is NotificationPreferences => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.pushEnabled === "boolean" &&
        typeof candidate.messagesEnabled === "boolean" &&
        typeof candidate.bidsEnabled === "boolean" &&
        typeof candidate.requestUpdatesEnabled === "boolean" &&
        typeof candidate.savedRequestsEnabled === "boolean" &&
        typeof candidate.nearbyAlertsEnabled === "boolean" &&
        (candidate.nearbyAlertRadiusKm === 1 ||
            candidate.nearbyAlertRadiusKm === 3 ||
            candidate.nearbyAlertRadiusKm === 5 ||
            candidate.nearbyAlertRadiusKm === 10 ||
            candidate.nearbyAlertRadiusKm === 25) &&
        typeof candidate.nearbyAlertsUrgentOnly === "boolean" &&
        Array.isArray(candidate.nearbyAlertCategorySlugs) &&
        candidate.nearbyAlertCategorySlugs.every((slug) => typeof slug === "string")
    );
};

export const getDefaultNotificationPreferences = (): NotificationPreferences => {
    return defaultPreferences;
};

export const saveNotificationPreferences = async (
    preferences: NotificationPreferences
) => {
    inMemoryPreferences = preferences;
    const serialized = JSON.stringify(preferences);

    const webStorage = getWebStorage();
    if (webStorage) {
        webStorage.setItem(NOTIFICATION_PREFERENCES_KEY, serialized);
        return;
    }

    if (!(await canUseSecureStore())) return;

    try {
        await SecureStore.setItemAsync(NOTIFICATION_PREFERENCES_KEY, serialized);
    } catch {
        // Ignore persistence failures; memory fallback is already updated.
    }
};

export const getNotificationPreferences =
    async (): Promise<NotificationPreferences> => {
        const webStorage = getWebStorage();
        if (webStorage) {
            const rawValue = webStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
            if (!rawValue) {
                return inMemoryPreferences;
            }

            try {
                const parsed = JSON.parse(rawValue);
                if (isNotificationPreferences(parsed)) {
                    inMemoryPreferences = parsed;
                    return parsed;
                }
            } catch {
                // Ignore invalid data and fall back.
            }

            return inMemoryPreferences;
        }

        if (await canUseSecureStore()) {
            try {
                const stored = await SecureStore.getItemAsync(
                    NOTIFICATION_PREFERENCES_KEY
                );

                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (isNotificationPreferences(parsed)) {
                        inMemoryPreferences = parsed;
                        return parsed;
                    }
                }
            } catch {
                // Ignore invalid data and fall back.
            }
        }

        return inMemoryPreferences;
    };
