import type { AppNotification } from "../types/notification.types";
import {
    deleteNotificationApi,
    fetchNotificationPreferencesApi,
    fetchNotificationsApi,
    getUnreadCountApi,
    markAllAsReadApi,
    markAsReadApi,
    markAsUnreadApi,
    registerPushTokenApi,
    unregisterPushTokenApi,
    updateNotificationPreferencesApi,
} from "../api/notification.api";
import type { NotificationPreferencesDto } from "../types/notification.types";

export const fetchNotifications = async (): Promise<AppNotification[]> => {
    return fetchNotificationsApi();
};

export const fetchUnreadCount = async (): Promise<number> => {
    return getUnreadCountApi();
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    await markAsReadApi(notificationId);
};

export const markNotificationAsUnread = async (notificationId: string): Promise<void> => {
    await markAsUnreadApi(notificationId);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    await markAllAsReadApi();
};

export const deleteNotificationById = async (notificationId: string): Promise<void> => {
    await deleteNotificationApi(notificationId);
};

export const registerPushToken = async (token: string, platform: string): Promise<void> => {
    await registerPushTokenApi(token, platform);
};

export const unregisterPushToken = async (token: string): Promise<void> => {
    await unregisterPushTokenApi(token);
};

export const fetchNotificationPreferences =
    async (): Promise<NotificationPreferencesDto> => {
        return fetchNotificationPreferencesApi();
    };

export const updateNotificationPreferences = async (
    preferences: Partial<NotificationPreferencesDto>
): Promise<NotificationPreferencesDto> => {
    return updateNotificationPreferencesApi(preferences);
};

export const fetchAllNotifications = fetchNotifications;
export const getUnreadCount = fetchUnreadCount;
export const markAsRead = markNotificationAsRead;
export const markAsUnread = markNotificationAsUnread;
export const markAllAsRead = markAllNotificationsAsRead;
export const deleteNotification = deleteNotificationById;
export const registerNotificationPushToken = registerPushToken;
export const unregisterNotificationPushToken = unregisterPushToken;
