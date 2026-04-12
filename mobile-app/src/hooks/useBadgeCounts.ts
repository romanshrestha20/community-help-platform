import { useCallback, useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { create } from "zustand";

import { getMyConversations } from "@/features/conversation/services/conversation.service";
import { fetchUnreadCount } from "@/features/notifications/service/notification.service";

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

    const refreshMessageCount = useCallback(async () => {
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
    }, []);

    const refreshNotificationCount = useCallback(async () => {
        try {
            const unreadCount = await fetchUnreadCount();
            useBadgeCountStore.getState().setNotificationCount(unreadCount);
        } catch (error) {
            console.warn("Failed to refresh notification badge count:", error);
        }
    }, []);

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
