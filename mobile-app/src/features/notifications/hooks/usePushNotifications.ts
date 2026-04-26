import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { useNotificationSettingsStore } from "@/features/settings/store/notification-settings.store";
import { registerPushToken, unregisterPushToken } from "../service/notification.service";
import type { NotificationPermissionStatus } from "../types/notification.types";
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
    const projectId = getProjectId();
    if (!projectId) {
        throw new Error("Expo project ID is missing");
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
};

const normalizePermissionStatus = (
    status: Notifications.PermissionStatus
): NotificationPermissionStatus => {
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
};

const getRegistrationErrorMessage = (error: unknown) => {
    if (!(error instanceof Error)) {
        return "Push registration failed";
    }

    const message = error.message.trim();

    if (/physical device/i.test(message)) {
        return "Push notifications require a physical Android device.";
    }

    if (/project id/i.test(message)) {
        return "Expo project configuration is missing for push notifications.";
    }

    return message || "Push registration failed";
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
    const setRegistrationState = useNotificationSettingsStore(
        (state) => state.setRegistrationState
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

                console.log("[push] foreground notification decision", {
                    notificationType,
                    isEnabled,
                });

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
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            });
        }
    }, []);

    useEffect(() => {
        if (Platform.OS === "web") {
            return;
        }

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const route = response.notification.request.content.data?.route;

            console.log("[push] notification response received", {
                route,
                notificationId: response.notification.request.identifier,
            });

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
            setRegistrationState("idle", {
                error: null,
            });

            if (lastRegisteredToken.current) {
                console.log("[push] unregistering push token", {
                    tokenSuffix: lastRegisteredToken.current.slice(-8),
                });

                void unregisterPushToken(lastRegisteredToken.current)
                    .then(() => {
                        console.log("[push] backend token unregistration succeeded");
                    })
                    .catch((error) => {
                        console.warn("Failed to unregister push notifications:", error);
                    });
                lastRegisteredToken.current = null;
            }
            return;
        }

        let isCancelled = false;

        const registerToken = async () => {
            try {
                const permissions = await Notifications.getPermissionsAsync();
                const initialPermissionStatus = normalizePermissionStatus(permissions.status);

                console.log("[push] current permission status", {
                    status: initialPermissionStatus,
                });

                let permissionStatus = permissions.status;

                if (permissionStatus !== "granted") {
                    setRegistrationState("requesting-permission", {
                        permissionStatus: initialPermissionStatus,
                        error: null,
                    });

                    const request = await Notifications.requestPermissionsAsync();
                    permissionStatus = request.status;

                    console.log("[push] permission request resolved", {
                        status: permissionStatus,
                    });
                }

                const normalizedPermissionStatus = normalizePermissionStatus(permissionStatus);

                if (permissionStatus !== "granted") {
                    setRegistrationState("denied", {
                        permissionStatus: normalizedPermissionStatus,
                        error: "Android notifications are blocked. Enable them in system settings.",
                    });
                    return;
                }

                setRegistrationState("registering-token", {
                    permissionStatus: normalizedPermissionStatus,
                    error: null,
                });

                const token = await registerForPushNotificationsAsync();

                console.log("[push] expo push token fetched", {
                    tokenSuffix: token?.slice(-8),
                });

                if (!token || isCancelled) {
                    return;
                }

                if (lastRegisteredToken.current === token) {
                    setRegistrationState("registered", {
                        permissionStatus: normalizedPermissionStatus,
                        error: null,
                    });
                    return;
                }

                if (lastRegisteredToken.current) {
                    console.log("[push] unregistering previous push token", {
                        tokenSuffix: lastRegisteredToken.current.slice(-8),
                    });
                    await unregisterPushToken(lastRegisteredToken.current);
                    console.log("[push] previous token unregistered");
                }

                lastRegisteredToken.current = token;
                await registerPushToken(token, Platform.OS);

                console.log("[push] backend token registration succeeded", {
                    platform: Platform.OS,
                    tokenSuffix: token.slice(-8),
                });

                setRegistrationState("registered", {
                    permissionStatus: normalizedPermissionStatus,
                    error: null,
                });
            } catch (error) {
                const message = getRegistrationErrorMessage(error);

                console.warn("[push] registration failed", {
                    message,
                    rawError: error,
                });

                setRegistrationState("failed", {
                    permissionStatus: "granted",
                    error: message,
                });
                console.warn("Failed to register push notifications:", error);
            }
        };

        void registerToken();

        return () => {
            isCancelled = true;
        };
    }, [isAuthenticated, isHydrated, pushEnabled, setRegistrationState]);
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
