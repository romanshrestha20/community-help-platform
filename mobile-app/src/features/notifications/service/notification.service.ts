import type { AppNotification } from "../types/notification.types";
import {
    deleteNotificationApi,
    fetchNotificationsApi,
    getUnreadCountApi,
    markAllAsReadApi,
    markAsReadApi,
    markAsUnreadApi,
} from "../api/notification.api";

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

export const fetchAllNotifications = fetchNotifications;
export const getUnreadCount = fetchUnreadCount;
export const markAsRead = markNotificationAsRead;
export const markAsUnread = markNotificationAsUnread;
export const markAllAsRead = markAllNotificationsAsRead;
export const deleteNotification = deleteNotificationById;