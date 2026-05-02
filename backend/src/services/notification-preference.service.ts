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

const isLegacyNearbyPreferenceColumnError = (error: unknown) => {
    if (!error || typeof error !== "object") return false;

    const maybePrismaError = error as { code?: string; message?: string };
    const message = (maybePrismaError.message || "").toLowerCase();

    const referencesNearbyPreferenceField =
        message.includes("nearbyalertsenabled") ||
        message.includes("nearbyalertradiuskm") ||
        message.includes("nearbyalertsurgentonly") ||
        message.includes("nearbyalertcategoryslugs");

    if (!referencesNearbyPreferenceField) {
        return false;
    }

    // P2022: missing column in database.
    if (maybePrismaError.code === "P2022") {
        return true;
    }

    // Prisma client/schema mismatch can surface as validation-style errors.
    return (
        message.includes("unknown field") ||
        message.includes("unknown argument") ||
        message.includes("column does not exist")
    );
};

const withDefaultNearbyFields = (
    preferences: Omit<
        NotificationPreferences,
        "nearbyAlertsUrgentOnly" | "nearbyAlertCategorySlugs"
    >
): NotificationPreferences => {
    return {
        ...preferences,
        nearbyAlertsUrgentOnly: defaultNotificationPreferences.nearbyAlertsUrgentOnly,
        nearbyAlertCategorySlugs: defaultNotificationPreferences.nearbyAlertCategorySlugs,
    };
};

export const getDefaultNotificationPreferences = () => {
    return defaultNotificationPreferences;
};

export const getNotificationPreferencesForUser = async (
    userId: string
): Promise<NotificationPreferences> => {
    try {
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
    } catch (error) {
        if (!isLegacyNearbyPreferenceColumnError(error)) {
            throw error;
        }

        const legacyPreferences = await prisma.notificationPreference.upsert({
            where: { userId },
            update: {},
            create: {
                userId,
                pushEnabled: defaultNotificationPreferences.pushEnabled,
                messagesEnabled: defaultNotificationPreferences.messagesEnabled,
                bidsEnabled: defaultNotificationPreferences.bidsEnabled,
                requestUpdatesEnabled: defaultNotificationPreferences.requestUpdatesEnabled,
                savedRequestsEnabled: defaultNotificationPreferences.savedRequestsEnabled,
            },
            select: {
                pushEnabled: true,
                messagesEnabled: true,
                bidsEnabled: true,
                requestUpdatesEnabled: true,
                savedRequestsEnabled: true,
            },
        });

        return {
            ...legacyPreferences,
            nearbyAlertsEnabled: defaultNotificationPreferences.nearbyAlertsEnabled,
            nearbyAlertRadiusKm: defaultNotificationPreferences.nearbyAlertRadiusKm,
            nearbyAlertsUrgentOnly: defaultNotificationPreferences.nearbyAlertsUrgentOnly,
            nearbyAlertCategorySlugs: defaultNotificationPreferences.nearbyAlertCategorySlugs,
        };
    }
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

    try {
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
    } catch (error) {
        if (!isLegacyNearbyPreferenceColumnError(error)) {
            throw error;
        }

        const legacyNextPreferences = {
            pushEnabled: nextPreferences.pushEnabled,
            messagesEnabled: nextPreferences.messagesEnabled,
            bidsEnabled: nextPreferences.bidsEnabled,
            requestUpdatesEnabled: nextPreferences.requestUpdatesEnabled,
            savedRequestsEnabled: nextPreferences.savedRequestsEnabled,
        };

        const legacyPreferences = await prisma.notificationPreference.upsert({
            where: { userId },
            update: legacyNextPreferences,
            create: {
                userId,
                pushEnabled: legacyNextPreferences.pushEnabled ?? defaultNotificationPreferences.pushEnabled,
                messagesEnabled: legacyNextPreferences.messagesEnabled ?? defaultNotificationPreferences.messagesEnabled,
                bidsEnabled: legacyNextPreferences.bidsEnabled ?? defaultNotificationPreferences.bidsEnabled,
                requestUpdatesEnabled:
                    legacyNextPreferences.requestUpdatesEnabled ??
                    defaultNotificationPreferences.requestUpdatesEnabled,
                savedRequestsEnabled:
                    legacyNextPreferences.savedRequestsEnabled ??
                    defaultNotificationPreferences.savedRequestsEnabled,
            },
            select: {
                pushEnabled: true,
                messagesEnabled: true,
                bidsEnabled: true,
                requestUpdatesEnabled: true,
                savedRequestsEnabled: true,
            },
        });

        return {
            ...legacyPreferences,
            nearbyAlertsEnabled: defaultNotificationPreferences.nearbyAlertsEnabled,
            nearbyAlertRadiusKm: defaultNotificationPreferences.nearbyAlertRadiusKm,
            nearbyAlertsUrgentOnly: defaultNotificationPreferences.nearbyAlertsUrgentOnly,
            nearbyAlertCategorySlugs: defaultNotificationPreferences.nearbyAlertCategorySlugs,
        };
    }
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
