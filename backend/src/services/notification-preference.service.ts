import { NotificationType } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export type NotificationPreferences = {
    pushEnabled: boolean;
    messagesEnabled: boolean;
    bidsEnabled: boolean;
    requestUpdatesEnabled: boolean;
    savedRequestsEnabled: boolean;
    nearbyAlertsEnabled: boolean;
    nearbyAlertRadiusKm: number;
    nearbyAlertsUrgentOnly: boolean;
    nearbyAlertCategorySlugs: string[];
};

const defaultNotificationPreferences: NotificationPreferences = {
    pushEnabled: true,
    messagesEnabled: true,
    bidsEnabled: true,
    requestUpdatesEnabled: true,
    savedRequestsEnabled: false,
    nearbyAlertsEnabled: false,
    nearbyAlertRadiusKm: 5,
    nearbyAlertsUrgentOnly: false,
    nearbyAlertCategorySlugs: [],
};

const bidTypes: NotificationType[] = [
    "BID_RECEIVED",
    "BID_ACCEPTED",
    "BID_REJECTED",
];

const requestUpdateTypes: NotificationType[] = [
    "REQUEST_ASSIGNED",
    "REQUEST_COMPLETED",
    "REQUEST_CANCELLED",
];

const savedRequestTypes: NotificationType[] = [
    "REVIEW_RECEIVED",
    "REVIEW_REPLY_RECEIVED",
];

export const getDefaultNotificationPreferences = () => {
    return defaultNotificationPreferences;
};

export const getNotificationPreferencesForUser = async (
    userId: string
): Promise<NotificationPreferences> => {
    const preferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: {},
        create: {
            userId,
            ...defaultNotificationPreferences,
        },
        select: {
            pushEnabled: true,
            messagesEnabled: true,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: true,
            nearbyAlertsEnabled: true,
            nearbyAlertRadiusKm: true,
            nearbyAlertsUrgentOnly: true,
            nearbyAlertCategorySlugs: true,
        },
    });

    return preferences;
};

export const updateNotificationPreferencesForUser = async (
    userId: string,
    updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
    const currentPreferences = await getNotificationPreferencesForUser(userId);
    const nextPreferences = {
        ...currentPreferences,
        ...updates,
    };

    const preferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: nextPreferences,
        create: {
            userId,
            ...nextPreferences,
        },
        select: {
            pushEnabled: true,
            messagesEnabled: true,
            bidsEnabled: true,
            requestUpdatesEnabled: true,
            savedRequestsEnabled: true,
            nearbyAlertsEnabled: true,
            nearbyAlertRadiusKm: true,
            nearbyAlertsUrgentOnly: true,
            nearbyAlertCategorySlugs: true,
        },
    });

    return preferences;
};

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

    if (savedRequestTypes.includes(type)) {
        return preferences.savedRequestsEnabled;
    }

    return true;
};

export const filterNotificationTypesByPreferences = (
    types: NotificationType[],
    preferences: NotificationPreferences
) => {
    return types.filter((type) => isNotificationTypeEnabled(type, preferences));
};
