import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { create } from "zustand";

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
    messages: 3,
    notifications: 0,
    setMessageCount: (count) => set({ messages: count }),
    setNotificationCount: (count) => set({ notifications: count }),
}));

export const useBadgeCounts = (): BadgeCounts => {
    const messages = useBadgeCountStore((state) => state.messages);
    const notifications = useBadgeCountStore((state) => state.notifications);

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

        const syncNotificationCount = async () => {
            if (!isActive) {
                return;
            }

            await refreshNotificationCount();
        };

        void syncNotificationCount();

        const intervalId = setInterval(() => {
            void syncNotificationCount();
        }, 30000);

        const appStateSubscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                void syncNotificationCount();
            }
        });

        return () => {
            isActive = false;
            clearInterval(intervalId);
            appStateSubscription.remove();
        };
    }, [refreshNotificationCount]);

    return { messages, notifications };
};

export const setNotificationBadgeCount = (count: number) => {
    useBadgeCountStore.getState().setNotificationCount(count);
};
