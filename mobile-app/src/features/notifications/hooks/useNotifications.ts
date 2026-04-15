import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { setNotificationBadgeCount } from "@/hooks/useBadgeCounts";
import { useNotificationSettingsStore } from "@/features/settings/store/notification-settings.store";
import type { AppNotification } from "../types/notification.types";
import {
    deleteNotificationById,
    fetchNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    markNotificationAsUnread,
} from "../service/notification.service";
import { filterNotificationsByPreferences } from "../utils/notification-preferences";

const sortNewestFirst = (items: AppNotification[]) => {
    return [...items].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
};

export const useNotifications = () => {
    const {
        isHydrated,
        pushEnabled,
        messagesEnabled,
        bidsEnabled,
        requestUpdatesEnabled,
        savedRequestsEnabled,
        initializeNotificationSettings,
    } = useNotificationSettingsStore();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setNotificationBadgeCount(unreadCount);
    }, [unreadCount]);

    useEffect(() => {
        void initializeNotificationSettings();
    }, [initializeNotificationSettings]);

    const getErrorMessage = (caughtError: unknown, fallback: string) => {
        return caughtError instanceof Error ? caughtError.message : fallback;
    };

    const preferences = useMemo(
        () => ({
            pushEnabled,
            messagesEnabled,
            bidsEnabled,
            requestUpdatesEnabled,
            savedRequestsEnabled,
        }),
        [
            pushEnabled,
            messagesEnabled,
            bidsEnabled,
            requestUpdatesEnabled,
            savedRequestsEnabled,
        ]
    );

    const loadNotifications = useCallback(async () => {
        setError(null);

        const items = await fetchNotifications();
        const visibleItems = filterNotificationsByPreferences(items, preferences);
        const visibleUnreadCount = visibleItems.filter(
            (notification) => !notification.isRead
        ).length;

        setNotifications(sortNewestFirst(visibleItems));
        setUnreadCount(visibleUnreadCount);
    }, [preferences]);

    const reload = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadNotifications();
        } finally {
            setRefreshing(false);
        }
    }, [loadNotifications]);

    useEffect(() => {
        if (!isHydrated) {
            return;
        }

        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                if (isMounted) {
                    await loadNotifications();
                }
            } catch (caughtError) {
                if (isMounted) {
                    setError(caughtError instanceof Error ? caughtError.message : "Could not load notifications");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [isHydrated, loadNotifications]);

    useFocusEffect(
        useCallback(() => {
            if (!isHydrated) {
                return undefined;
            }

            const sync = () =>
                loadNotifications().catch((caughtError) => {
                    setError(getErrorMessage(caughtError, "Could not load notifications"));
                });

            void sync();

            const intervalId = setInterval(() => {
                void sync();
            }, 15000);

            return () => {
                clearInterval(intervalId);
            };
        }, [isHydrated, loadNotifications])
    );

    useEffect(() => {
        if (!isHydrated) {
            return;
        }

        const subscription = AppState.addEventListener("change", (nextState) => {
            if (nextState !== "active") {
                return;
            }

            void loadNotifications().catch((caughtError) => {
                setError(getErrorMessage(caughtError, "Could not load notifications"));
            });
        });

        return () => {
            subscription.remove();
        };
    }, [isHydrated, loadNotifications]);

    const markRead = useCallback(async (notificationId: string) => {
        setActionLoadingId(notificationId);
        try {
            await markNotificationAsRead(notificationId);
            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                        : notification
                )
            );
            setUnreadCount((count) => Math.max(count - 1, 0));
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not mark notification as read"));
        } finally {
            setActionLoadingId(null);
        }
    }, []);

    const markUnread = useCallback(async (notificationId: string) => {
        setActionLoadingId(notificationId);
        try {
            await markNotificationAsUnread(notificationId);
            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, isRead: false, readAt: null }
                        : notification
                )
            );
            setUnreadCount((count) => count + 1);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not mark notification as unread"));
        } finally {
            setActionLoadingId(null);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        setActionLoadingId("all");
        try {
            await markAllNotificationsAsRead();
            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true,
                    readAt: notification.readAt ?? new Date().toISOString(),
                }))
            );
            setUnreadCount(0);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not mark all notifications as read"));
        } finally {
            setActionLoadingId(null);
        }
    }, []);

    const removeNotification = useCallback(async (notificationId: string) => {
        setActionLoadingId(notificationId);
        try {
            const target = notifications.find((notification) => notification.id === notificationId);
            await deleteNotificationById(notificationId);
            setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
            if (target && !target.isRead) {
                setUnreadCount((count) => Math.max(count - 1, 0));
            }
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not delete notification"));
        } finally {
            setActionLoadingId(null);
        }
    }, [notifications]);

    const unreadNotifications = useMemo(
        () => notifications.filter((notification) => !notification.isRead),
        [notifications]
    );

    return {
        notifications,
        unreadNotifications,
        unreadCount,
        loading,
        refreshing,
        error,
        actionLoadingId,
        reload,
        markRead,
        markUnread,
        markAllRead,
        removeNotification,
    };
};
