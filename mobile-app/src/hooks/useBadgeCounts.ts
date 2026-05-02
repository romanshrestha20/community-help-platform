import { useCallback, useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { create } from "zustand";

import { getMyConversations } from "@/features/conversation/services/conversation.service";
import { fetchNotifications } from "@/features/notifications/service/notification.service";
import { useNotificationSettingsStore } from "@/features/settings/store/notification-settings.store";
import { filterNotificationsByPreferences } from "@/features/notifications/utils/notification-preferences";
import { useAuthStore } from "@/features/auth/store/auth.store";

export interface BadgeCounts {
    messages: number;
    notifications: number;
}

type BadgeCountState = BadgeCounts & {
    setMessageCount: (count: number) => void;
    setNotificationCount: (count: number) => void;
};

const useBadgeCountStore = create<BadgeCountState>((set) => ({
    messages: 0,
    notifications: 0,
    setMessageCount: (count) => set({ messages: count }),
    setNotificationCount: (count) => set({ notifications: count }),
}));

export const useBadgeCounts = (): BadgeCounts => {
    const messages = useBadgeCountStore((state) => state.messages);
    const notifications = useBadgeCountStore((state) => state.notifications);
    const {
        isHydrated,
        pushEnabled,
        messagesEnabled,
        bidsEnabled,
        requestUpdatesEnabled,
        savedRequestsEnabled,
        initializeNotificationSettings,
    } = useNotificationSettingsStore();
    const canAccessVerifiedRoutes = useAuthStore((state) =>
        Boolean(
            state.isAuthenticated &&
            state.user &&
            state.user.isEmailVerified
        )
    );

    useEffect(() => {
        void initializeNotificationSettings();
    }, [initializeNotificationSettings]);

    const refreshMessageCount = useCallback(async () => {
        if (!canAccessVerifiedRoutes) {
            useBadgeCountStore.getState().setMessageCount(0);
            return;
        }
        try {
            const conversations = await getMyConversations();
            const unreadCount = conversations.reduce(
                (total, conversation) => total + conversation.unreadCount,
                0
            );

            useBadgeCountStore.getState().setMessageCount(unreadCount);
        } catch (error) {
            console.warn("Failed to refresh message badge count:", error);
        }
    }, [canAccessVerifiedRoutes]);

    const refreshNotificationCount = useCallback(async () => {
        if (!canAccessVerifiedRoutes) {
            useBadgeCountStore.getState().setNotificationCount(0);
            return;
        }
        try {
            if (!isHydrated) {
                return;
            }

            const items = await fetchNotifications();
            const visibleItems = filterNotificationsByPreferences(items, {
                pushEnabled,
                messagesEnabled,
                bidsEnabled,
                requestUpdatesEnabled,
                savedRequestsEnabled,
                nearbyAlertsEnabled: false,
                nearbyAlertRadiusKm: 5,
                nearbyAlertsUrgentOnly: false,
                nearbyAlertCategorySlugs: [],
            });
            const unreadCount = visibleItems.filter(
                (notification) => !notification.isRead
            ).length;

            useBadgeCountStore.getState().setNotificationCount(unreadCount);
        } catch (error) {
            console.warn("Failed to refresh notification badge count:", error);
        }
    }, [
        bidsEnabled,
        canAccessVerifiedRoutes,
        isHydrated,
        messagesEnabled,
        pushEnabled,
        requestUpdatesEnabled,
        savedRequestsEnabled,
    ]);

    useEffect(() => {
        let isActive = true;

        const syncBadgeCounts = async () => {
            if (!isActive) {
                return;
            }

            await Promise.all([
                refreshMessageCount(),
                refreshNotificationCount(),
            ]);
        };

        void syncBadgeCounts();

        const intervalId = setInterval(() => {
            void syncBadgeCounts();
        }, 30000);

        const appStateSubscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                void syncBadgeCounts();
            }
        });

        return () => {
            isActive = false;
            clearInterval(intervalId);
            appStateSubscription.remove();
        };
    }, [refreshMessageCount, refreshNotificationCount]);

    useEffect(() => {
        if (Platform.OS === "web") {
            return;
        }

        void Notifications.setBadgeCountAsync(notifications).catch((error) => {
            console.warn("Failed to sync native app badge count:", error);
        });
    }, [notifications]);

    return { messages, notifications };
};

export const setNotificationBadgeCount = (count: number) => {
    useBadgeCountStore.getState().setNotificationCount(count);
};
