import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { registerPushToken, unregisterPushToken } from "../service/notification.service";

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
    const lastRegisteredToken = useRef<string | null>(null);
    const previousAuthState = useRef<boolean>(isAuthenticated);

    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
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
        if (!isAuthenticated || Platform.OS === "web") {
            if (previousAuthState.current && lastRegisteredToken.current) {
                void unregisterPushToken(lastRegisteredToken.current).catch((error) => {
                    console.warn("Failed to unregister push notifications:", error);
                });
                lastRegisteredToken.current = null;
            }

            previousAuthState.current = isAuthenticated;
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

                lastRegisteredToken.current = token;
                await registerPushToken(token, Platform.OS);
            } catch (error) {
                console.warn("Failed to register push notifications:", error);
            }
        };

        void registerToken();
        previousAuthState.current = isAuthenticated;

        return () => {
            isCancelled = true;
        };
    }, [isAuthenticated]);
};