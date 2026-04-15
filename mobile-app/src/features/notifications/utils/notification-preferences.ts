import type {
    AppNotification,
    NotificationType,
} from "../types/notification.types";
import type { NotificationPreferences } from "@/utils/notificationPreference";

const requestUpdateTypes: NotificationType[] = [
    "REQUEST_ASSIGNED",
    "REQUEST_COMPLETED",
    "REQUEST_CANCELLED",
];

const bidTypes: NotificationType[] = [
    "BID_RECEIVED",
    "BID_ACCEPTED",
    "BID_REJECTED",
];

const reviewTypes: NotificationType[] = [
    "REVIEW_RECEIVED",
    "REVIEW_REPLY_RECEIVED",
];

export const isNotificationTypeEnabled = (
    type: NotificationType,
    preferences: NotificationPreferences
) => {
    if (!preferences.pushEnabled) {
        return false;
    }

    if (type === "MESSAGE_RECEIVED") {
        return preferences.messagesEnabled;
    }

    if (bidTypes.includes(type)) {
        return preferences.bidsEnabled;
    }

    if (requestUpdateTypes.includes(type)) {
        return preferences.requestUpdatesEnabled;
    }

    if (reviewTypes.includes(type)) {
        return preferences.savedRequestsEnabled;
    }

    return true;
};

export const isNotificationEnabled = (
    notification: Pick<AppNotification, "type">,
    preferences: NotificationPreferences
) => {
    return isNotificationTypeEnabled(notification.type, preferences);
};

export const filterNotificationsByPreferences = (
    notifications: AppNotification[],
    preferences: NotificationPreferences
) => {
    return notifications.filter((notification) =>
        isNotificationEnabled(notification, preferences)
    );
};
