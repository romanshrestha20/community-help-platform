import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { addSocketListener, connectSocket } from "@/lib/socket-client";

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
    const canAccessVerifiedRoutes = useAuthStore((state) =>
        Boolean(
            state.isAuthenticated &&
            state.user &&
            state.user.isEmailVerified
        )
    );
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
            nearbyAlertsEnabled: false,
            nearbyAlertRadiusKm: 5 as const,
            nearbyAlertsUrgentOnly: false,
            nearbyAlertCategorySlugs: [],
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
        if (!canAccessVerifiedRoutes) {
            setNotifications([]);
            setUnreadCount(0);
            setError(null);
            return;
        }

        setError(null);

        const items = await fetchNotifications();
        const visibleItems = filterNotificationsByPreferences(items, preferences);
        const visibleUnreadCount = visibleItems.filter(
            (notification) => !notification.isRead
        ).length;

        setNotifications(sortNewestFirst(visibleItems));
        setUnreadCount(visibleUnreadCount);
    }, [canAccessVerifiedRoutes, preferences]);

    const reload = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadNotifications();
        } finally {
            setRefreshing(false);
        }
    }, [loadNotifications]);

    useEffect(() => {
        if (!isHydrated || !canAccessVerifiedRoutes) {
            setLoading(false);
            setNotifications([]);
            setUnreadCount(0);
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
    }, [canAccessVerifiedRoutes, isHydrated, loadNotifications]);

    useFocusEffect(
        useCallback(() => {
            if (!isHydrated || !canAccessVerifiedRoutes) {
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
        }, [canAccessVerifiedRoutes, isHydrated, loadNotifications])
    );

    useEffect(() => {
        if (!isHydrated || !canAccessVerifiedRoutes) {
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
    }, [canAccessVerifiedRoutes, isHydrated, loadNotifications]);

    useEffect(() => {
        if (!isHydrated || !canAccessVerifiedRoutes) {
            return;
        }

        let isMounted = true;
        const cleanupFns: (() => void)[] = [];

        const bindRealtime = async () => {
            try {
                await connectSocket();
                cleanupFns.push(
                    addSocketListener<{ unreadCount?: number }>("notification:event", (payload) => {
                        if (!isMounted) return;

                        if (typeof payload?.unreadCount === "number") {
                            setUnreadCount(payload.unreadCount);
                        }

                        void loadNotifications().catch((caughtError) => {
                            setError(getErrorMessage(caughtError, "Could not refresh notifications"));
                        });
                    })
                );
            } catch (caughtError) {
                setError(getErrorMessage(caughtError, "Could not connect live notifications"));
            }
        };

        void bindRealtime();

        return () => {
            isMounted = false;
            cleanupFns.forEach((cleanup) => cleanup());
        };
    }, [canAccessVerifiedRoutes, isHydrated, loadNotifications]);

    const markRead = useCallback(async (notificationId: string) => {
        if (!canAccessVerifiedRoutes) return;
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
    }, [canAccessVerifiedRoutes]);

    const markUnread = useCallback(async (notificationId: string) => {
        if (!canAccessVerifiedRoutes) return;
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
    }, [canAccessVerifiedRoutes]);

    const markAllRead = useCallback(async () => {
        if (!canAccessVerifiedRoutes) return;
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
    }, [canAccessVerifiedRoutes]);

    const removeNotification = useCallback(async (notificationId: string) => {
        if (!canAccessVerifiedRoutes) return;
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
    }, [canAccessVerifiedRoutes, notifications]);

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
