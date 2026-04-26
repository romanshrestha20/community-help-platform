import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
    fetchNotificationPreferences,
    updateNotificationPreferences,
} from "@/features/notifications/service/notification.service";
import type {
    NotificationPermissionStatus,
    NotificationRegistrationStatus,
} from "@/features/notifications/types/notification.types";
import {
    getDefaultNotificationPreferences,
    getNotificationPreferences,
    NotificationPreferences,
    saveNotificationPreferences,
} from "@/utils/notificationPreference";

type NotificationSettingsState = NotificationPreferences & {
    isHydrated: boolean;
    registrationStatus: NotificationRegistrationStatus;
    permissionStatus: NotificationPermissionStatus;
    lastRegistrationError: string | null;
    initializeNotificationSettings: () => Promise<void>;
    syncNotificationSettings: () => Promise<void>;
    setPreference: <K extends keyof NotificationPreferences>(
        key: K,
        value: NotificationPreferences[K]
    ) => Promise<void>;
    setRegistrationState: (
        status: NotificationRegistrationStatus,
        options?: {
            permissionStatus?: NotificationPermissionStatus;
            error?: string | null;
        }
    ) => void;
};

const defaultPreferences = getDefaultNotificationPreferences();

export const useNotificationSettingsStore =
    create<NotificationSettingsState>((set, get) => ({
        ...defaultPreferences,
        isHydrated: false,
        registrationStatus: "idle",
        permissionStatus: null,
        lastRegistrationError: null,

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
                registrationStatus: get().registrationStatus,
                permissionStatus: get().permissionStatus,
                lastRegistrationError: get().lastRegistrationError,
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
        setRegistrationState: (status, options) => {
            set({
                registrationStatus: status,
                permissionStatus:
                    options?.permissionStatus !== undefined
                        ? options.permissionStatus
                        : get().permissionStatus,
                lastRegistrationError:
                    options?.error !== undefined
                        ? options.error
                        : status === "registered" || status === "idle"
                            ? null
                            : get().lastRegistrationError,
            });
        },
    }));
