import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
    fetchNotificationPreferences,
    updateNotificationPreferences,
} from "@/features/notifications/service/notification.service";
import {
    getDefaultNotificationPreferences,
    getNotificationPreferences,
    NotificationPreferences,
    saveNotificationPreferences,
} from "@/utils/notificationPreference";

type NotificationSettingsState = NotificationPreferences & {
    isHydrated: boolean;
    initializeNotificationSettings: () => Promise<void>;
    syncNotificationSettings: () => Promise<void>;
    setPreference: <K extends keyof NotificationPreferences>(
        key: K,
        value: NotificationPreferences[K]
    ) => Promise<void>;
};

const defaultPreferences = getDefaultNotificationPreferences();

export const useNotificationSettingsStore =
    create<NotificationSettingsState>((set, get) => ({
        ...defaultPreferences,
        isHydrated: false,

        initializeNotificationSettings: async () => {
            if (get().isHydrated) return;

            const isAuthenticated = useAuthStore.getState().isAuthenticated;
            const storedPreferences = isAuthenticated
                ? await fetchNotificationPreferences().catch(() => getNotificationPreferences())
                : await getNotificationPreferences();

            set({
                ...storedPreferences,
                isHydrated: true,
            });

            await saveNotificationPreferences(storedPreferences);
        },

        syncNotificationSettings: async () => {
            const isAuthenticated = useAuthStore.getState().isAuthenticated;
            const nextPreferences = isAuthenticated
                ? await fetchNotificationPreferences().catch(() => getNotificationPreferences())
                : await getNotificationPreferences();

            set({
                ...nextPreferences,
                isHydrated: true,
            });

            await saveNotificationPreferences(nextPreferences);
        },

        setPreference: async (key, value) => {
            const nextState = {
                pushEnabled: get().pushEnabled,
                messagesEnabled: get().messagesEnabled,
                bidsEnabled: get().bidsEnabled,
                requestUpdatesEnabled: get().requestUpdatesEnabled,
                savedRequestsEnabled: get().savedRequestsEnabled,
                [key]: value,
            } as NotificationPreferences;

            set(nextState);
            await saveNotificationPreferences(nextState);

            if (!useAuthStore.getState().isAuthenticated) {
                return;
            }

            try {
                const syncedPreferences = await updateNotificationPreferences({
                    [key]: value,
                });

                set({
                    ...syncedPreferences,
                    isHydrated: true,
                });
                await saveNotificationPreferences(syncedPreferences);
            } catch {
                // Keep local state so the UI remains responsive even if sync fails.
            }
        },
    }));
