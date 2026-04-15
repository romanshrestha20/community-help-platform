import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { useNotificationSettingsStore } from "@/features/settings/store/notification-settings.store";
import { registerPushToken, unregisterPushToken } from "../service/notification.service";
import { isNotificationTypeEnabled } from "../utils/notification-preferences";

const getProjectId = () => {
    const constants = Constants as typeof Constants & {
        easConfig?: { projectId?: string };
        expoConfig?: { extra?: { eas?: { projectId?: string } } };
    };

    return (
        constants.easConfig?.projectId ||
        constants.expoConfig?.extra?.eas?.projectId ||
        undefined
    );
};

const registerForPushNotificationsAsync = async () => {
    const permissions = await Notifications.getPermissionsAsync();
    let status = permissions.status;

    if (status !== "granted") {
        const request = await Notifications.requestPermissionsAsync();
        status = request.status;
    }

    if (status !== "granted") {
        return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
        throw new Error("Expo project ID is missing");
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
};

export const usePushNotifications = () => {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const pushEnabled = useNotificationSettingsStore((state) => state.pushEnabled);
    const isHydrated = useNotificationSettingsStore((state) => state.isHydrated);
    const initializeNotificationSettings = useNotificationSettingsStore(
        (state) => state.initializeNotificationSettings
    );
    const syncNotificationSettings = useNotificationSettingsStore(
        (state) => state.syncNotificationSettings
    );
    const lastRegisteredToken = useRef<string | null>(null);

    useEffect(() => {
        void initializeNotificationSettings();
    }, [initializeNotificationSettings]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        void syncNotificationSettings();
    }, [isAuthenticated, syncNotificationSettings]);

    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                const state = useNotificationSettingsStore.getState();
                const notificationType = notification.request.content.data?.type;
                const isEnabled =
                    typeof notificationType === "string" &&
                    isHydratedNotificationType(notificationType)
                        ? isNotificationTypeEnabled(notificationType, {
                            pushEnabled: state.pushEnabled,
                            messagesEnabled: state.messagesEnabled,
                            bidsEnabled: state.bidsEnabled,
                            requestUpdatesEnabled: state.requestUpdatesEnabled,
                            savedRequestsEnabled: state.savedRequestsEnabled,
                        })
                        : state.pushEnabled;

                return {
                    shouldShowAlert: isEnabled,
                    shouldShowBanner: isEnabled,
                    shouldShowList: isEnabled,
                    shouldPlaySound: isEnabled,
                    shouldSetBadge: isEnabled,
                };
            },
        });

        if (Platform.OS === "android") {
            void Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#6AA84F",
                sound: "default",
            });
        }
    }, []);

    useEffect(() => {
        if (Platform.OS === "web") {
            return;
        }

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const route = response.notification.request.content.data?.route;

            if (typeof route === "string" && route.length > 0) {
                router.push(route as never);
            }
        });

        return () => {
            responseSubscription.remove();
        };
    }, [router]);

    useEffect(() => {
        if (Platform.OS === "web" || !isHydrated) {
            return;
        }

        if (!isAuthenticated || !pushEnabled) {
            if (lastRegisteredToken.current) {
                void unregisterPushToken(lastRegisteredToken.current).catch((error) => {
                    console.warn("Failed to unregister push notifications:", error);
                });
                lastRegisteredToken.current = null;
            }
            return;
        }

        let isCancelled = false;

        const registerToken = async () => {
            try {
                const token = await registerForPushNotificationsAsync();

                if (!token || isCancelled) {
                    return;
                }

                if (lastRegisteredToken.current === token) {
                    return;
                }

                if (lastRegisteredToken.current) {
                    await unregisterPushToken(lastRegisteredToken.current);
                }

                lastRegisteredToken.current = token;
                await registerPushToken(token, Platform.OS);
            } catch (error) {
                console.warn("Failed to register push notifications:", error);
            }
        };

        void registerToken();

        return () => {
            isCancelled = true;
        };
    }, [isAuthenticated, isHydrated, pushEnabled]);
};

const isHydratedNotificationType = (value: string): value is Parameters<
    typeof isNotificationTypeEnabled
>[0] => {
    return (
        value === "BID_RECEIVED" ||
        value === "BID_ACCEPTED" ||
        value === "BID_REJECTED" ||
        value === "REQUEST_ASSIGNED" ||
        value === "REQUEST_COMPLETED" ||
        value === "REQUEST_CANCELLED" ||
        value === "MESSAGE_RECEIVED" ||
        value === "REVIEW_RECEIVED" ||
        value === "REVIEW_REPLY_RECEIVED" ||
        value === "SYSTEM"
    );
};
